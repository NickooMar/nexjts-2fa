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

const contracts = {
  all: () => ["contracts"] as const,
  lists: () => [...contracts.all(), "list"] as const,
  list: (propertyIdOrSlug: string) =>
    [...contracts.lists(), propertyIdOrSlug] as const,
};

/**
 * Billing is scoped to the active organization (encoded in the token), so —
 * like everything else — keys carry no tenant id and the cache is cleared on
 * tenant switch. Plans are the global public catalog.
 */
const billing = {
  all: () => ["billing"] as const,
  plans: () => [...billing.all(), "plans"] as const,
  subscription: () => [...billing.all(), "subscription"] as const,
  usage: () => [...billing.all(), "usage"] as const,
  invoices: () => [...billing.all(), "invoices"] as const,
  payments: () => [...billing.all(), "payments"] as const,
};

/** Property tenants (renters) — not organizations. */
const tenants = {
  all: () => ["tenants"] as const,
  lists: () => [...tenants.all(), "list"] as const,
  list: () => [...tenants.lists()] as const,
  byProperty: (propertyIdOrSlug: string) =>
    [...tenants.all(), "by-property", propertyIdOrSlug] as const,
};

/**
 * Geographic reference data. Global and static (not tenant-scoped), so these
 * keys carry no tenant id and the data is cached aggressively — see
 * use-locations.ts.
 */
const locations = {
  all: () => ["locations"] as const,
  countries: () => [...locations.all(), "countries"] as const,
  states: (countryCode: string) =>
    [...locations.all(), "states", countryCode] as const,
  cities: (countryCode: string, stateCode: string) =>
    [...locations.all(), "cities", countryCode, stateCode] as const,
};

export const queryKeys = {
  organizations,
  memberships,
  properties,
  contracts,
  tenants,
  billing,
  locations,
} as const;
