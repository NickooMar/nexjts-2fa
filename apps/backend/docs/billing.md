# Billing, Subscriptions & Plan Management

Organization-level SaaS billing for the property manager platform: plans,
subscriptions, usage metering, plan enforcement, invoices, payments and
feature entitlements, implemented as a dedicated **billing microservice**
(`apps/billing`) that follows the same conventions as the auth/user/email
services (NestJS TCP microservice, `app/controller` + `domain` +
`infrastructure` layout, gateway-side proxy, Joi-validated env).

## 1. Architecture

```
                        ┌──────────────────────────────┐
   HTTP (REST /api/v1)  │   main (gateway, :3000)      │
  ──────────────────────►                              │
                        │  BillingController           │   TCP @MessagePattern
                        │  BillingWebhookController    ├──────────────► billing (:3004)
                        │  PlanEnforcementService ─────┤  send()        ├ PlanController
                        │  ApiUsageInterceptor         │                ├ SubscriptionController
                        │  BillingProxy ───────────────┤  emit()        ├ UsageController
                        └───────────┬──────────────────┘   TCP @EventPattern
                                    │ send()                ├ UsageEventsController
                                    ▼                       ├ InvoiceController
                            user (:3002)                    └ WebhookController
                     (property/member/storage counts)              │
                                                                   ▼
                                                       Mongo control-plane DB
                                                  plans, subscriptions, usages,
                                                  invoices, payments, featureflags
```

Key decisions:

- **Billing is organization-scoped.** Every record keys on `organizationId`
  (the control-plane `Tenant` id). Users are never referenced except as audit
  (`createdBy`), so a user in N organizations sees N independent
  subscriptions, and **ownership transfers cannot affect billing**.
- **Data lives in the control-plane database** (same one as
  users/tenants/memberships), because subscriptions span tenants rather than
  belonging to a tenant's data plane (`tenant_<slug>` DBs).
- **Synchronous RPC only where the answer is needed to proceed**
  (limit checks, reads, mutations); **fire-and-forget events**
  (`client.emit` → `@EventPattern`) for usage tracking, so metering never
  adds latency or failure modes to business operations.

### Payment provider abstraction

```
PaymentProvider (abstract, domain/contracts)
 ├── MockPaymentProvider      (implemented — synchronous settle, HMAC webhooks)
 ├── StripeProvider           (future)
 └── MercadoPagoProvider      (future)
```

The domain depends only on the `PaymentProvider` port
(`createCheckout`, `charge`, `cancelRemote`, `verifyAndParseWebhook`).
`PaymentProviderFactory` resolves the adapter from
`BILLING_PAYMENT_PROVIDER` — exactly the strategy pattern the email service
uses for Resend. Adding Stripe = one new class + one factory case; zero
changes to subscription/invoice/usage logic. Webhooks are normalized by the
adapter into provider-agnostic events (`payment_succeeded`,
`payment_failed`, `subscription_cancelled`) before the domain sees them.

## 2. Data model (Mongo, control plane)

| Collection            | Purpose | Notable indexes |
|-----------------------|---------|-----------------|
| `plans`               | Sellable catalog. `limits` and `features` are **open maps** (`Mixed`), so new limits/toggles are data inserts — no migration. `-1` = unlimited. Soft delete via `archivedAt`. | `slug` unique; `(isPublic, archivedAt, sortOrder)` |
| `subscriptions`       | One **current** row per org (`isCurrent: true`, enforced by partial unique index); plan changes/cancellations close the row and open a new one, so the collection is also the audit trail. | `(organizationId, isCurrent)` unique partial; `(organizationId, createdAt)` |
| `subscriptionusages`  | Counters per `(organizationId, period)`. `period = 'lifetime'` holds gauges (properties, members, storageBytes, activeListings); `period = 'YYYY-MM'` holds monthly meters (apiRequests, fileUploads, leads) that reset by key. Atomic `$inc`. | `(organizationId, period)` unique |
| `invoices`            | One per charged period; line items embedded; sequential numbers (`INV-2026-000042`) from an atomic counter doc. | `number` unique; `(organizationId, createdAt)`; `(status, dueDate)` |
| `payments`            | One row per charge **attempt** (retries append). | `(organizationId, createdAt)`; `invoiceId` |
| `featureflags`        | Per-org feature overrides merged over `plan.features` (time-boxed via `expiresAt`). | `(organizationId, key)` unique |
| `processedevents`     | Event dedup ledger (`eventId` unique, TTL 7 days) — makes at-least-once event delivery idempotent. | `eventId` unique, TTL |

All schemas carry `timestamps`, audit fields (`createdBy` where a user acts),
and soft-delete (`deletedAt` / `archivedAt`) where history matters.

### Migrations / seeds

`PlanSeedService` runs on every billing boot and **upserts with
`$setOnInsert`** — it inserts missing plan slugs (free / starter / pro /
business) and never overwrites operator edits. Changing limits, prices or
features at runtime is done through the DB or the plan API patterns
(`BILLING_CREATE_PLAN` / `UPDATE_PLAN` / `ARCHIVE_PLAN`); nothing is
hardcoded. Indexes are created by Mongoose on boot.

## 3. Subscription lifecycle

States: `trialing → active → past_due → suspended → cancelled → expired`,
guarded by an explicit transition table in `SubscriptionService`
(invalid transitions throw).

- **Provisioning** — `ORGANIZATION_CREATED` event (or first read — lazy
  bootstrap for orgs that predate billing) subscribes the org to
  `BILLING_DEFAULT_PLAN` (free).
- **Trial** — first paid checkout grants `plan.trialDays` once per
  organization, ever (history is checked). No charge during trial.
- **Renewal / trial conversion** — applied **lazily on read** and by the
  `BILLING_RUN_LIFECYCLE` sweep (wire a cron/scheduler to it in production;
  without one the lazy path still keeps state correct). Charge success rolls
  the period; failure → `past_due` + an **open invoice**.
- **Past due → suspended** — after `BILLING_PAST_DUE_GRACE_DAYS` (default 7)
  the subscription suspends and **every gated write is rejected**
  (`subscription_inactive`).
- **Retries** — `POST /billing/retry-payment` (or a `payment_succeeded`
  webhook) recharges the latest open invoice; success reactivates and
  restores the period from the invoice.
- **Cancel / resume** — cancel keeps service until period end
  (`cancelAtPeriodEnd`), then the row closes as `cancelled` and the org
  falls back to the free plan; resume undoes a pending cancel.
- **Plan changes** — apply immediately. Upgrades charge the new price now
  (simplification: no proration credit). **Downgrades are blocked while
  current usage exceeds the target plan's limits**
  (`downgrade_exceeds_limits`).

## 4. Usage tracking

Two complementary mechanisms:

1. **Event-sourced counters** — the gateway emits fire-and-forget events
   after successful operations; the billing service applies them
   idempotently (dedup by `eventId`):

   | Event | Effect |
   |---|---|
   | `PROPERTY_CREATED` / `PROPERTY_DELETED` | `properties` gauge ±1 |
   | `MEMBER_ADDED` / `MEMBER_REMOVED` | `members` gauge ±1 |
   | `FILE_UPLOADED` / `FILE_DELETED` | `storageBytes` gauge ± bytes, `fileUploads` monthly meter |
   | `API_USAGE` | `apiRequests` monthly meter (batched every 10 s by `ApiUsageInterceptor`) |
   | `LEAD_CAPTURED` | `leads` monthly meter |
   | `ORGANIZATION_CREATED` | provisions the subscription, seeds `members = 1` |

2. **Authoritative reconciliation (`SYNC_USAGE`)** — `GET /billing/usage`
   (and plan changes) first pull exact gauges from their sources — property
   count and stored bytes from the user service (`PROPERTY_COUNT`,
   `MEDIA_TOTAL_SIZE` aggregate), member count
   (`MEMBERSHIP_COUNT_BY_TENANT`) — and push them to billing. Event drift
   therefore self-heals on every dashboard view.

Entitlements (plan limits + features + org overrides + live status) are
cached in-memory in the billing service for 30 s and invalidated on every
subscription mutation, so limit checks are cheap.

## 5. Plan enforcement (server-side, never frontend)

`PlanEnforcementService` (gateway) calls `BILLING_CHECK_LIMIT` **before** the
guarded write; the frontend UI is cosmetic only.

| Operation | Guard |
|---|---|
| `POST /properties` | `properties` limit vs **live count** |
| `POST /properties/:id/images|documents` | `storageGb` (bytes) + `fileUploadsPerMonth`, before any byte hits the bucket |
| `POST /organizations/invitations` | `members` limit vs live member count |
| `POST /organizations/join` | invitation is **peeked** (read-only) to resolve the target org, member limit checked before the membership is created |
| any of the above while suspended/expired | rejected with `subscription_inactive` |

Violations return **HTTP 402** with
`{ message: "plan_limit_reached", code, limitKey, limit, current, currentPlan, currentPlanName, upgradeAvailable }`
so clients can render an upgrade prompt without another round-trip.
Property creation uses `code: "PROPERTY_LIMIT_EXCEEDED"`. If the billing service is down, checks **fail
open** by default (`BILLING_ENFORCEMENT_FAIL_OPEN=true`, same availability
trade-off as `RATE_LIMIT_FAIL_OPEN`) or fail closed with 503.

Feature gating: backend reads `entitlements.features.*`; the frontend
consumes the same payload via `useEntitlements()` / `hasFeature(key)`.

## 6. HTTP API (gateway, `/api/v1/billing`)

All routes require a JWT except webhooks. Reads are open to any member of
the active organization; mutations require the **owner** role
(`ROLES_THAT_MANAGE_BILLING`). The organization always comes from the token.

| Method & path | Description | Errors |
|---|---|---|
| `GET /billing/plans` | Public plan catalog | — |
| `GET /billing/subscription` | `{ subscription, plan, entitlements }`; auto-provisions + advances lifecycle | — |
| `GET /billing/entitlements` | Cached entitlements payload | — |
| `GET /billing/usage` | Usage meters (reconciles gauges first) | — |
| `GET /billing/invoices` / `GET /billing/payments` | Billing history (newest first, 50) | — |
| `POST /billing/checkout` `{ planSlug, billingCycle }` | Subscribe / start trial; returns `checkoutUrl` for redirect providers | `402 payment_failed`, `400 already_subscribed`, `404 plan_not_found` |
| `POST /billing/change-plan` `{ planSlug, billingCycle }` | Upgrade / downgrade | `400 downgrade_exceeds_limits`, `402 payment_failed` |
| `POST /billing/cancel` / `POST /billing/resume` | Cancel at period end / undo | `400 already_cancelled` / `400 not_cancelled` |
| `POST /billing/retry-payment` | Recharge the latest open invoice | `400 nothing_to_retry`, `402 payment_failed` |
| `POST /billing/webhooks/:provider` | Unauthenticated; signature verified by the provider adapter | `400 invalid_webhook_signature` |

Mock-provider webhook example (drives `past_due` end-to-end in dev):

```bash
BODY='{"type":"payment_failed","organizationId":"<orgId>","failureReason":"card_declined"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$BILLING_WEBHOOK_SECRET" -hex | sed 's/.* //')
curl -X POST localhost:3000/api/v1/billing/webhooks/mock \
  -H "content-type: application/json" -H "x-billing-signature: $SIG" -d "$BODY"
```

## 7. Frontend

`/billing` (sidebar → Billing) renders the organization billing dashboard:
current plan + status badges (trial/cancelling/past-due), usage meters with
80%/100% thresholds, the reusable plan grid with monthly/yearly toggle and
upgrade/downgrade confirmation, cancel/resume/retry actions (owner only),
and invoice/payment history tabs. The property-creation wizard reuses that
same plan grid inside a `PropertyLimitUpgradeModal`: when `POST /properties`
returns `PROPERTY_LIMIT_EXCEEDED`, the wizard suppresses the generic toast,
shows the modal, and retries the in-memory submission after a successful
upgrade. The frontend follows the established layering —
`hooks/queries|mutations` → `services/api/*.api.ts` →
`app/actions/*.actions.ts` → gateway — with keys under
`queryKeys.billing.*` (cache cleared on org switch like everything else),
meta-driven toasts and i18n (en/es).

## 8. Testing

- `apps/billing/.../usage.service.spec.ts` — enforcement math (unlimited,
  GB→bytes, authoritative override, inactive subscription), event
  idempotency, reconciliation clamping.
- `apps/billing/.../subscription.service.spec.ts` — lifecycle: lazy
  provisioning, trial conversion, failed renewal → past_due, grace →
  suspended, cancel lapse → free fallback, one-trial-per-org, downgrade
  guard, retry reactivation.
- `apps/main/src/billing/plan-enforcement.service.spec.ts` — 402 mapping,
  storage+upload double check, fail-open/fail-closed.

Run: `npx jest apps/billing apps/main/src/billing`.

E2E happy path (manual or future supertest): create org → free sub
provisioned → create properties to the limit → 4th rejected 402 → checkout
pro (trial) → limit lifts → simulate `payment_failed` webhook → past_due →
retry-payment → active → cancel → period lapse → free fallback.

## 9. Load testing considerations

- **Hot path** is `CHECK_LIMIT`: one cached entitlements lookup + one
  indexed counter read. Target it first (k6/vegeta through
  `POST /properties`); watch billing p99 and Mongo `subscriptionusages`
  read latency.
- API metering is batched (10 s windows) — high RPS costs one map increment
  per request in the gateway, one event per org per window.
- Usage events are `$inc` upserts on a unique index — they don't contend
  with reads; dedup inserts are TTL-bounded.
- The lifecycle sweep is O(due subscriptions); run it from a single cron
  instance to avoid duplicate charges (lazy evaluation tolerates overlap,
  charges are guarded by status transitions, but don't invite races).
- Entitlement cache is per-process; with many gateway/billing replicas the
  30 s TTL bounds staleness — fine for limits, revisit for hard feature
  kills.

## 10. Security review

- **Tenant isolation**: `organizationId` is always derived from the JWT in
  the gateway; no billing pattern accepts a client-supplied org id.
- **AuthZ**: mutations owner-only (`ROLES_THAT_MANAGE_BILLING`); reads
  member-only; plan CRUD patterns are not exposed over HTTP (ops/seed only).
- **Webhooks**: unauthenticated by nature → HMAC-verified
  (timing-safe compare) inside the provider adapter before parsing; invalid
  signatures are 400 and never reach domain logic. Real providers must use
  their official signature schemes (Stripe: raw body — `rawBody: true` will
  be needed on the gateway bootstrap).
- **Enforcement bypass**: limit checks live server-side at the gateway, and
  suspended subscriptions are re-checked inside the billing service
  (`isOperational`), so a stale client cannot write past a dead
  subscription.
- **Money integrity**: amounts in integer minor units; invoice numbers from
  an atomic counter; payment attempts are append-only; webhook + retry paths
  both mark invoices paid idempotently.
- **Fail-open trade-off** is explicit and configurable
  (`BILLING_ENFORCEMENT_FAIL_OPEN=false` for strict environments).
- Rate limiting/lockouts from the existing security module apply to billing
  routes like any other gateway route.

## 11. Scalability & future work

- **Transport**: TCP `emit` is at-most-once from the broker's perspective;
  for stronger delivery move events to RabbitMQ/Kafka — only the
  `ClientsModule` registration and the emit call site change, handlers and
  dedup already assume at-least-once.
- **Stripe/Mercado Pago**: implement `PaymentProvider`, register in the
  factory, store provider customer/subscription ids (fields already exist),
  switch `BILLING_PAYMENT_PROVIDER`. Hosted checkout already flows through
  (`outcome: 'pending'` + `checkoutUrl`).
- **Proration**: replace the immediate-charge simplification with credit
  notes (model cleanly as negative invoice line items).
- **Per-seat / metered pricing**: monthly meters already exist; add a
  `pricingModel` field to plans and an aggregation step at invoice time.
- **Redis entitlement cache** if billing becomes multi-replica and 30 s
  in-process staleness is too loose.
- **Dunning**: schedule N retry attempts with backoff before suspension
  (attempt counts are already recorded per invoice).
- **Reporting**: invoices/payments collections are append-only and indexed
  by `(organizationId, createdAt)` — safe to point read replicas / exports
  at them.
