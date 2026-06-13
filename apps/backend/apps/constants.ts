export const Clients = {
  MAIN_CLIENT: 'MAIN_CLIENT',
  AUTH_CLIENT: 'AUTH_CLIENT',
  USER_CLIENT: 'USER_CLIENT',
  EMAIL_CLIENT: 'EMAIL_CLIENT',
  BILLING_CLIENT: 'BILLING_CLIENT',
} as const;

export const Services = {
  MAIN_SERVICE: 'MAIN_SERVICE',
  AUTH_SERVICE: 'AUTH_SERVICE',
  USER_SERVICE: 'USER_SERVICE',
  EMAIL_SERVICE: 'EMAIL_SERVICE',
  BILLING_SERVICE: 'BILLING_SERVICE',
} as const;

export const Repositories = {
  USER_REPOSITORY: 'USER_REPOSITORY',
  TENANT_REPOSITORY: 'TENANT_REPOSITORY',
  PROPERTY_REPOSITORY: 'PROPERTY_REPOSITORY',
  MEMBERSHIP_REPOSITORY: 'MEMBERSHIP_REPOSITORY',
} as const;

export const MongoDatabases = {
  /** Shared control-plane database (tenants + users). */
  CONTROL_PLANE: 'property-manager',
} as const;

/** Prefix for per-tenant data-plane databases: `tenant_<slug>`. */
export const TENANT_DB_PREFIX = 'tenant_';

/**
 * Roles a user can hold *within an organization*. Stored on the membership
 * (the user↔tenant join), so the same person can be an owner of one org and a
 * viewer of another. Ordered most → least privileged.
 */
export const OrganizationRoles = {
  OWNER: 'owner', // full control incl. billing + deleting the org
  ADMIN: 'admin', // manage members + all resources
  MANAGER: 'manager', // manage properties/contracts, not members
  MEMBER: 'member', // standard read/write on assigned resources
  VIEWER: 'viewer', // read-only
} as const;

export type OrganizationRole =
  (typeof OrganizationRoles)[keyof typeof OrganizationRoles];

export const ORGANIZATION_ROLES = Object.values(
  OrganizationRoles,
) as OrganizationRole[];

/** Roles that may manage other members (used for authorization checks). */
export const ROLES_THAT_MANAGE_MEMBERS: OrganizationRole[] = [
  OrganizationRoles.OWNER,
  OrganizationRoles.ADMIN,
];

/** Roles that may create/update/delete properties. */
export const ROLES_THAT_MANAGE_PROPERTIES: OrganizationRole[] = [
  OrganizationRoles.OWNER,
  OrganizationRoles.ADMIN,
  OrganizationRoles.MANAGER,
];

/**
 * Roles that may manage the organization's subscription (checkout, plan
 * changes, cancellation). Per the role contract above, billing is owner-only;
 * every member may *read* billing state (plan, usage, history).
 */
export const ROLES_THAT_MANAGE_BILLING: OrganizationRole[] = [
  OrganizationRoles.OWNER,
];

export const AuthPatterns = {
  SIGNIN: 'AUTH_SIGNIN',
  SIGNUP: 'AUTH_SIGNUP',
  SWITCH_TENANT: 'AUTH_SWITCH_TENANT',
  CREATE_ORGANIZATION: 'AUTH_CREATE_ORGANIZATION',
  VERIFY_EMAIL: 'AUTH_VERIFY_EMAIL',
  REFRESH_TOKEN: 'AUTH_REFRESH_TOKEN',
  FIND_USER_BY_EMAIL: 'AUTH_FIND_USER_BY_EMAIL',
  VERIFY_EMAIL_VERIFICATION_TOKEN: 'AUTH_VERIFY_EMAIL_VERIFICATION_TOKEN',
} as const;

export const InvitationPatterns = {
  CREATE: 'INVITATION_CREATE',
  ACCEPT: 'INVITATION_ACCEPT',
  /** Read-only lookup by code (no side effects) — used for plan enforcement. */
  PEEK: 'INVITATION_PEEK',
} as const;

export const MembershipPatterns = {
  CREATE: 'MEMBERSHIP_CREATE',
  UPDATE_ROLE: 'MEMBERSHIP_UPDATE_ROLE',
  LIST_ORGS: 'MEMBERSHIP_LIST_ORGS',
  LIST_MEMBERS: 'MEMBERSHIP_LIST_MEMBERS',
  COUNT_BY_TENANT: 'MEMBERSHIP_COUNT_BY_TENANT',
  FIND_BY_USER: 'MEMBERSHIP_FIND_BY_USER',
  FIND_PRIMARY_FOR_USER: 'MEMBERSHIP_FIND_PRIMARY_FOR_USER',
  FIND_BY_USER_AND_TENANT: 'MEMBERSHIP_FIND_BY_USER_AND_TENANT',
} as const;

export const UserPatterns = {
  CREATE: 'USER_CREATE',
  UPDATE: 'USER_UPDATE',
  FIND_BY_ID: 'USER_FIND_BY_ID',
  FIND_BY_EMAIL: 'USER_FIND_BY_EMAIL',
  FIND_BY_EMAIL_AND_PASSWORD: 'USER_FIND_BY_EMAIL_AND_PASSWORD',
} as const;

export const TenantPatterns = {
  CREATE: 'TENANT_CREATE',
  FIND_BY_ID: 'TENANT_FIND_BY_ID',
  FIND_BY_SLUG: 'TENANT_FIND_BY_SLUG',
  UPDATE_BRANDING: 'TENANT_UPDATE_BRANDING',
} as const;

export const PropertyPatterns = {
  CREATE: 'PROPERTY_CREATE',
  UPDATE: 'PROPERTY_UPDATE',
  DELETE: 'PROPERTY_DELETE',
  COUNT: 'PROPERTY_COUNT',
  FIND_ALL: 'PROPERTY_FIND_ALL',
  FIND_BY_ID: 'PROPERTY_FIND_BY_ID',
  FIND_ONE: 'PROPERTY_FIND_ONE',
} as const;

export const ContractPatterns = {
  CREATE: 'CONTRACT_CREATE',
  UPDATE: 'CONTRACT_UPDATE',
  DELETE: 'CONTRACT_DELETE',
  FIND_ONE: 'CONTRACT_FIND_ONE',
  FIND_BY_PROPERTY: 'CONTRACT_FIND_BY_PROPERTY',
} as const;

/**
 * "Property tenants" are the people renting/occupying a property (stored in
 * the tenant database) — not to be confused with `Tenant`, the control-plane
 * organization document that gives multi-tenancy its name.
 */
export const PropertyTenantPatterns = {
  CREATE: 'PROPERTY_TENANT_CREATE',
  UPDATE: 'PROPERTY_TENANT_UPDATE',
  DELETE: 'PROPERTY_TENANT_DELETE',
  ATTACH: 'PROPERTY_TENANT_ATTACH',
  DETACH: 'PROPERTY_TENANT_DETACH',
  FIND_ALL: 'PROPERTY_TENANT_FIND_ALL',
  FIND_BY_PROPERTY: 'PROPERTY_TENANT_FIND_BY_PROPERTY',
} as const;

/**
 * Property owners are the people who own a property (stored in the tenant
 * database, in a roster separate from renters). Same shape as property
 * tenants — see PropertyTenantPatterns.
 */
export const PropertyOwnerPatterns = {
  CREATE: 'PROPERTY_OWNER_CREATE',
  UPDATE: 'PROPERTY_OWNER_UPDATE',
  DELETE: 'PROPERTY_OWNER_DELETE',
  ATTACH: 'PROPERTY_OWNER_ATTACH',
  DETACH: 'PROPERTY_OWNER_DETACH',
  FIND_ALL: 'PROPERTY_OWNER_FIND_ALL',
  FIND_BY_PROPERTY: 'PROPERTY_OWNER_FIND_BY_PROPERTY',
} as const;

/**
 * Entities that can own media assets. Property media lives in the tenant
 * database; organization branding (logo/banner) lives on the control-plane
 * tenant document instead — see TenantPatterns.UPDATE_BRANDING.
 */
export const MediaOwnerTypes = {
  PROPERTY: 'property',
  CONTRACT: 'contract',
  ORGANIZATION: 'organization',
  USER: 'user',
} as const;

export type MediaOwnerType =
  (typeof MediaOwnerTypes)[keyof typeof MediaOwnerTypes];

export const MediaPatterns = {
  ADD: 'MEDIA_ADD',
  LIST: 'MEDIA_LIST',
  COUNT: 'MEDIA_COUNT',
  REMOVE: 'MEDIA_REMOVE',
  REORDER: 'MEDIA_REORDER',
  SET_COVER: 'MEDIA_SET_COVER',
  /** Total stored bytes across the tenant database (storage usage). */
  TOTAL_SIZE: 'MEDIA_TOTAL_SIZE',
} as const;

export const EmailPatterns = {
  SEND_VERIFICATION_EMAIL: 'EMAIL_SEND_VERIFICATION_EMAIL',
} as const;

export const EmailProviders = {
  RESEND: 'RESEND',
} as const;

/* ------------------------------------------------------------------------ */
/* Billing                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * Billing is organization-scoped: every pattern receives an `organizationId`
 * (the control-plane Tenant id), never a user id. A user belonging to many
 * organizations sees one independent subscription per organization, and
 * ownership transfers never touch billing state.
 */
export const BillingPatterns = {
  // Plans (configurable through the DB/API — never hardcoded)
  LIST_PLANS: 'BILLING_LIST_PLANS',
  GET_PLAN: 'BILLING_GET_PLAN',
  CREATE_PLAN: 'BILLING_CREATE_PLAN',
  UPDATE_PLAN: 'BILLING_UPDATE_PLAN',
  ARCHIVE_PLAN: 'BILLING_ARCHIVE_PLAN',

  // Subscription lifecycle
  GET_SUBSCRIPTION: 'BILLING_GET_SUBSCRIPTION',
  CHECKOUT: 'BILLING_CHECKOUT',
  CHANGE_PLAN: 'BILLING_CHANGE_PLAN',
  CANCEL_SUBSCRIPTION: 'BILLING_CANCEL_SUBSCRIPTION',
  RESUME_SUBSCRIPTION: 'BILLING_RESUME_SUBSCRIPTION',
  RUN_LIFECYCLE: 'BILLING_RUN_LIFECYCLE',

  // Usage & enforcement
  GET_USAGE: 'BILLING_GET_USAGE',
  SYNC_USAGE: 'BILLING_SYNC_USAGE',
  CHECK_LIMIT: 'BILLING_CHECK_LIMIT',
  GET_ENTITLEMENTS: 'BILLING_GET_ENTITLEMENTS',

  // History
  LIST_INVOICES: 'BILLING_LIST_INVOICES',
  LIST_PAYMENTS: 'BILLING_LIST_PAYMENTS',
  RETRY_PAYMENT: 'BILLING_RETRY_PAYMENT',

  // Provider webhooks (Stripe/Mercado Pago/…), forwarded raw by the gateway
  HANDLE_WEBHOOK: 'BILLING_HANDLE_WEBHOOK',
} as const;

/**
 * Fire-and-forget domain events consumed by the billing service to keep usage
 * counters up to date (`client.emit` → `@EventPattern`). Emitted by the
 * gateway after the underlying operation succeeded; consumers are idempotent
 * (deduplicated by `eventId`), so at-least-once delivery is safe.
 */
export const BillingEventPatterns = {
  ORGANIZATION_CREATED: 'BILLING_EVT_ORGANIZATION_CREATED',
  PROPERTY_CREATED: 'BILLING_EVT_PROPERTY_CREATED',
  PROPERTY_DELETED: 'BILLING_EVT_PROPERTY_DELETED',
  MEMBER_ADDED: 'BILLING_EVT_MEMBER_ADDED',
  MEMBER_REMOVED: 'BILLING_EVT_MEMBER_REMOVED',
  FILE_UPLOADED: 'BILLING_EVT_FILE_UPLOADED',
  FILE_DELETED: 'BILLING_EVT_FILE_DELETED',
  API_USAGE: 'BILLING_EVT_API_USAGE',
  LEAD_CAPTURED: 'BILLING_EVT_LEAD_CAPTURED',
} as const;

export const SubscriptionStatuses = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionStatuses)[keyof typeof SubscriptionStatuses];

/** Statuses under which an organization still has (some) service. */
export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatuses.TRIALING,
  SubscriptionStatuses.ACTIVE,
  SubscriptionStatuses.PAST_DUE,
];

export const BillingCycles = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type BillingCycle = (typeof BillingCycles)[keyof typeof BillingCycles];

/** Sentinel meaning "no limit" for any plan limit. */
export const UNLIMITED = -1;

/**
 * Well-known plan limit keys. Limits are stored as a flexible
 * `{ [key]: number }` map on the plan document, so new limits can ship
 * without schema migrations — these constants only name the ones the
 * application currently enforces or displays.
 */
export const PlanLimitKeys = {
  PROPERTIES: 'properties',
  STORAGE_GB: 'storageGb',
  ACTIVE_LISTINGS: 'activeListings',
  MEMBERS: 'members',
  API_REQUESTS_PER_MONTH: 'apiRequestsPerMonth',
  FILE_UPLOADS_PER_MONTH: 'fileUploadsPerMonth',
  LEADS_PER_MONTH: 'leadsPerMonth',
  CUSTOM_DOMAINS: 'customDomains',
  INTEGRATIONS: 'integrations',
} as const;

export type PlanLimitKey = (typeof PlanLimitKeys)[keyof typeof PlanLimitKeys];

/**
 * Well-known feature toggles (`plan.features.*`), merged with per-organization
 * FeatureFlag overrides into the entitlements the backend validates and the
 * frontend consumes. Like limits, features are an open map — new toggles need
 * no migration.
 */
export const PlanFeatureKeys = {
  CRM: 'crm',
  ANALYTICS: 'analytics',
  AI_DESCRIPTIONS: 'aiDescriptions',
  WHATSAPP_INTEGRATION: 'whatsappIntegration',
  CUSTOM_BRANDING: 'customBranding',
  API_ACCESS: 'apiAccess',
  PRIORITY_SUPPORT: 'prioritySupport',
} as const;

export type PlanFeatureKey =
  (typeof PlanFeatureKeys)[keyof typeof PlanFeatureKeys];

export const PaymentProviders = {
  MOCK: 'mock',
  STRIPE: 'stripe',
  MERCADO_PAGO: 'mercadopago',
} as const;

export type PaymentProviderName =
  (typeof PaymentProviders)[keyof typeof PaymentProviders];

export const InvoiceStatuses = {
  DRAFT: 'draft',
  OPEN: 'open',
  PAID: 'paid',
  VOID: 'void',
  UNCOLLECTIBLE: 'uncollectible',
} as const;

export type InvoiceStatus =
  (typeof InvoiceStatuses)[keyof typeof InvoiceStatuses];

export const PaymentStatuses = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus =
  (typeof PaymentStatuses)[keyof typeof PaymentStatuses];
