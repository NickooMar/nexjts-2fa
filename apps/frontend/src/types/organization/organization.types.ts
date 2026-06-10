export type OrganizationRole =
  | "owner"
  | "admin"
  | "manager"
  | "member"
  | "viewer";

export interface Organization {
  tenantId: string;
  name: string;
  slug: string;
  role: OrganizationRole;
  isPrimary: boolean;
}

export interface OrganizationMember {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: OrganizationRole;
  status: "active" | "invited" | "suspended";
  isPrimary: boolean;
}

/** Roles that can manage other members (mirror of the backend constant). */
export const ROLES_THAT_MANAGE_MEMBERS: OrganizationRole[] = ["owner", "admin"];

export const ASSIGNABLE_ROLES: OrganizationRole[] = [
  "admin",
  "manager",
  "member",
  "viewer",
];
