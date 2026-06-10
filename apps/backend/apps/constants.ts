export const Clients = {
  MAIN_CLIENT: 'MAIN_CLIENT',
  AUTH_CLIENT: 'AUTH_CLIENT',
  USER_CLIENT: 'USER_CLIENT',
  EMAIL_CLIENT: 'EMAIL_CLIENT',
} as const;

export const Services = {
  MAIN_SERVICE: 'MAIN_SERVICE',
  AUTH_SERVICE: 'AUTH_SERVICE',
  USER_SERVICE: 'USER_SERVICE',
  EMAIL_SERVICE: 'EMAIL_SERVICE',
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
} as const;

export const MembershipPatterns = {
  CREATE: 'MEMBERSHIP_CREATE',
  UPDATE_ROLE: 'MEMBERSHIP_UPDATE_ROLE',
  LIST_ORGS: 'MEMBERSHIP_LIST_ORGS',
  LIST_MEMBERS: 'MEMBERSHIP_LIST_MEMBERS',
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
} as const;

export const PropertyPatterns = {
  CREATE: 'PROPERTY_CREATE',
  UPDATE: 'PROPERTY_UPDATE',
  DELETE: 'PROPERTY_DELETE',
  FIND_ALL: 'PROPERTY_FIND_ALL',
  FIND_BY_ID: 'PROPERTY_FIND_BY_ID',
  FIND_ONE: 'PROPERTY_FIND_ONE',
} as const;

export const EmailPatterns = {
  SEND_VERIFICATION_EMAIL: 'EMAIL_SEND_VERIFICATION_EMAIL',
} as const;

export const EmailProviders = {
  RESEND: 'RESEND',
} as const;
