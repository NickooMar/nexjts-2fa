# React Query (TanStack Query) — Developer Guide

This app uses **TanStack React Query v5** as the standard for all server-state
on the client: fetching, caching, background refreshing, and mutations.
Everything except **authentication** (login, register, logout, session
validation, token refresh — all owned by NextAuth) goes through React Query.

## 1. Why React Query

Before this integration, client components managed server state by hand:
`useState` for data, `useTransition` for loading flags, manual `refresh()`
callbacks, and `router.refresh()` calls scattered after every mutation. That
pattern duplicates state (server cache vs. component state), goes stale
silently, and makes every new module re-implement loading/error/retry logic.

React Query replaces all of that with a single client-side cache:

- Components declare *what* they need (`useProperties()`); the cache decides
  *whether* a network request is necessary.
- Mutations invalidate exactly the affected keys; every mounted consumer
  refetches automatically.
- Loading, error, retry, and background-refresh behavior is configured once,
  globally.

## 2. Architecture

Auth tokens never reach the browser — they live in the NextAuth session,
server-side. So **server actions remain the transport**, and React Query
wraps them:

```text
component
  └─ hook (hooks/queries, hooks/mutations)   ← cache keys, invalidation, optimistic updates
      └─ service (services/api)              ← unwraps { success, error } envelopes, throws ApiError
          └─ server action (app/actions)     ← attaches tokens, calls the gateway
              └─ NestJS gateway
```

### Folder structure

```text
src/
├── lib/react-query/
│   ├── query-client.ts    # QueryClient factory, global defaults, toast-dispatching caches
│   ├── query-keys.ts      # the ONLY place query keys are defined
│   └── types.ts           # ApiError, retry classification, meta typing
├── components/
│   ├── providers/QueryProvider.tsx   # QueryClientProvider + devtools (mounted in root layout)
│   └── ui/states/                    # ErrorState, EmptyState, CardGridSkeleton
├── hooks/
│   ├── queries/           # useProperties, useProperty, useOrganizations, useOrganizationMembers
│   └── mutations/         # useCreateProperty, useUpdateProperty, useDeleteProperty,
│                          # useCreateOrganization, useJoinOrganization, useSwitchOrganization,
│                          # useCreateInvitation, useUpdateMemberRole
└── services/api/          # properties.api.ts, organizations.api.ts
```

### Why the service layer exists

Server actions return `{ success: false, error }` envelopes instead of
throwing (Next.js redacts thrown errors in production). React Query needs
*thrown* errors to drive retries and error states, so each service function
unwraps the envelope and throws a typed `ApiError` carrying the backend error
code. **Hooks never call server actions directly** — always go through
`services/api`.

## 3. Global configuration (`query-client.ts`)

| Setting | Value | Rationale |
|---|---|---|
| `staleTime` | 60 s | remounts/focus within a minute are served from cache, no request |
| `gcTime` | 5 min | unused cache entries are garbage-collected after 5 minutes |
| `retry` (queries) | 2× with backoff, **skipped** for non-retryable codes | auth/permission/not-found errors can't succeed on retry (see `NON_RETRYABLE_ERROR_CODES` in `types.ts`) |
| `retry` (mutations) | never | the server may already have applied the write |
| `refetchOnWindowFocus` / `OnReconnect` | true | stale data refreshes silently in the background |

The client is created per-request on the server and as a singleton in the
browser (`getQueryClient()`), the standard SSR-safe pattern.

### Notifications via `meta`

Toasts are dispatched by the **global** `QueryCache` / `MutationCache`, driven
by per-call `meta` — hooks and components never call toast libraries for
mutation outcomes:

- `meta.successMessage` — toast on mutation success
- `meta.errorMessage` — fallback toast on failure
- `meta.errorMessages` — map of backend error codes → user-facing messages
- query `meta.errorMessage` — only fires when the query has **no cached data**
  (background refetch failures stay silent and keep showing cached data)

All mutation hooks accept these as options, so callers pass translated
messages: see `CreatePropertyDialog` for the canonical example.

## 4. Query keys (`query-keys.ts`)

Keys are hierarchical and produced **only** by the factory — never write a
literal key array anywhere else:

```ts
queryKeys.properties.all()        // ["properties"]                 → everything
queryKeys.properties.lists()      // ["properties", "list"]         → all list variants
queryKeys.properties.list()       // ["properties", "list"]         → the list
queryKeys.properties.detail(slug) // ["properties", "detail", slug] → one property
queryKeys.organizations.list()
queryKeys.memberships.list()
```

Invalidating a prefix invalidates the whole subtree:
`invalidateQueries({ queryKey: queryKeys.properties.lists() })` refetches every
list variant.

### Multi-tenancy caveat (important)

All data is tenant-scoped server-side — the access token encodes the active
organization — so keys do **not** embed a tenant id. Consequently, any
mutation that changes the active tenant (**create / join / switch
organization**) must wipe the cache; otherwise the next render shows the
previous tenant's data. The org mutation hooks already do this
(`queryClient.clear()` + NextAuth `update()` + `router.refresh()`), so reuse
them rather than calling the services directly.

## 5. Creating a new query

1. Add keys to the factory in `query-keys.ts`.
2. Add a service function that unwraps the action envelope:

```ts
// services/api/units.api.ts
export async function fetchUnits(propertyId: string): Promise<Unit[]> {
  const result = await listUnitsAction(propertyId);
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.units;
}
```

3. Add the hook:

```ts
// hooks/queries/use-units.ts
export function useUnits(propertyId: string, options?: { initialData?: Unit[] }) {
  return useQuery({
    queryKey: queryKeys.units.list(propertyId),
    queryFn: () => fetchUnits(propertyId),
    initialData: options?.initialData,
    enabled: Boolean(propertyId),
  });
}
```

4. Consume it with the shared state components:

```tsx
const { data, isPending, isError, isFetching, refetch } = useUnits(propertyId);

if (isPending) return <CardGridSkeleton />;
if (isError && data === undefined)
  return <ErrorState title={t("error")} retryLabel={t("retry")} onRetry={() => refetch()} />;
if (data.length === 0) return <EmptyState icon={DoorOpen} title={t("empty")} />;
```

Note the `isError && data === undefined` guard: a failed *background* refetch
keeps showing cached data instead of replacing it with an error panel.

### Server prefetch + `initialData`

Server components keep prefetching for instant first paint, then hand the data
to the hook:

```tsx
// page.tsx (server)
const { success, properties } = await listPropertiesAction();
return <PropertiesClient initialProperties={success ? properties : undefined} />;

// PropertiesClient.tsx (client)
const { data } = useProperties({ initialData: initialProperties });
```

If the server fetch fails, pass `undefined` — the client query will fetch and
own the error/retry UX.

### Deferred queries

Pass `enabled` to avoid fetching until the UI needs it (e.g. `OrgSwitcher`
only fetches when the dropdown opens):

```ts
const { data } = useOrganizations({ enabled: open });
```

## 6. Creating a new mutation

Pattern (see `use-property-mutations.ts`): the hook owns **cache effects**,
the caller owns **UI effects** (translated toasts via options, dialog
close/navigation via `onSuccess`):

```ts
export function useCreateUnit(
  options?: MutationMessages & { onSuccess?: (unit: Unit) => void }
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUnit, // from services/api
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: (unit) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.units.lists() });
      options?.onSuccess?.(unit);
    },
  });
}
```

Usage in a component:

```tsx
const createUnit = useCreateUnit({
  successMessage: t("messages.success.created"),
  errorMessages: { insufficient_permissions: t("messages.errors.insufficient_permissions") },
  onSuccess: () => onOpenChange(false),
});

const onSubmit = async (values: FormState) =>
  createUnit.mutateAsync(toInput(values)).catch(() => {
    // toast already shown by the global mutation cache; keep the dialog open
  });
```

With `react-hook-form`, awaiting `mutateAsync` inside `onSubmit` keeps
`form.formState.isSubmitting` accurate; for plain buttons use
`mutation.isPending` (see `DeletePropertyDialog`).

## 7. Optimistic updates

Use them when the result is predictable and the wait is annoying — edits and
deletes of items already on screen. `useUpdateProperty` is the reference
implementation:

```ts
onMutate: async ({ idOrSlug, input }) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.properties.all() }); // don't race refetches
  const previousDetail = queryClient.getQueryData<Property>(detailKey);      // snapshot
  queryClient.setQueryData(detailKey, { ...previousDetail, ...input });      // apply optimistically
  return { previousDetail };                                                  // context for rollback
},
onError: (_e, _v, context) => {
  queryClient.setQueryData(detailKey, context.previousDetail);               // rollback
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.properties.lists() }); // reconcile with server
},
```

Skip optimistic updates when the server transforms the data unpredictably
(e.g. *create*, where the server assigns ids/slugs) — plain invalidation is
simpler and safe.

## 8. CRUD cheat-sheet (properties module = reference)

| Operation | Hook | Cache effect |
|---|---|---|
| List | `useProperties()` | — |
| Detail | `useProperty(idOrSlug)` | — |
| Create | `useCreateProperty()` | seeds detail cache, invalidates lists |
| Update | `useUpdateProperty()` | optimistic patch + rollback, re-seeds detail (handles slug renames), invalidates lists |
| Delete | `useDeleteProperty()` | optimistic removal + rollback, removes detail entry, invalidates lists |

## 9. Guidelines for future modules

- **Never** hardcode a query key — extend `query-keys.ts`.
- **Never** call a server action from a hook/component — add a service
  function in `services/api` that throws `ApiError`.
- New backend error codes that can't succeed on retry go into
  `NON_RETRYABLE_ERROR_CODES` (`lib/react-query/types.ts`).
- Tenant-scoped resources (units, tenants, maintenance, …) need no tenant id
  in their keys, but remember the cache is wiped on org change — nothing extra
  to do as long as you use the existing org mutation hooks.
- Auth stays out of React Query: NextAuth (`useSession`, `signIn`, `signOut`,
  `SessionChecker`) owns the session lifecycle.
- Devtools: available in development via the floating button (bottom-left);
  inspect cache contents, query states, and invalidations there.
