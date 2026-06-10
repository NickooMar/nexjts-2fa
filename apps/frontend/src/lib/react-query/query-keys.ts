/**
 * Centralized query key factory. Every query key in the app must come from
 * here — never hardcode key arrays in hooks or components.
 *
 * Keys are hierarchical so invalidation can target any level:
 *   queryKeys.properties.all()          → everything property-related
 *   queryKeys.properties.lists()        → every list variant
 *   queryKeys.properties.detail(slug)   → one property
 *
 * Note: all data is scoped to the active tenant server-side (the access token
 * encodes it), so keys do not embed a tenant id. Instead, mutations that
 * change the active tenant (create/join/switch organization) clear the whole
 * cache — see use-organization-mutations.ts.
 */

const organizations = {
  all: () => ["organizations"] as const,
  lists: () => [...organizations.all(), "list"] as const,
  list: () => [...organizations.lists()] as const,
};

const memberships = {
  all: () => ["memberships"] as const,
  lists: () => [...memberships.all(), "list"] as const,
  list: () => [...memberships.lists()] as const,
};

const properties = {
  all: () => ["properties"] as const,
  lists: () => [...properties.all(), "list"] as const,
  list: () => [...properties.lists()] as const,
  details: () => [...properties.all(), "detail"] as const,
  detail: (idOrSlug: string) => [...properties.details(), idOrSlug] as const,
};

export const queryKeys = {
  organizations,
  memberships,
  properties,
} as const;
