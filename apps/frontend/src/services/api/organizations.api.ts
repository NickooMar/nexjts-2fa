/**
 * Client-side service layer for organizations and memberships. Unwraps the
 * `{ success, error }` envelopes returned by server actions into thrown
 * ApiErrors so React Query can drive retries and error states.
 *
 * Note: create/join/switch refresh the NextAuth session server-side (the
 * backend re-issues tenant-scoped tokens). The corresponding mutation hooks
 * are responsible for clearing the query cache afterwards, since every
 * tenant-scoped cache entry belongs to the previous organization.
 */

import {
  listMembersAction,
  joinOrganizationAction,
  createInvitationAction,
  updateMemberRoleAction,
  listOrganizationsAction,
  createOrganizationAction,
  switchOrganizationAction,
  getOrganizationBrandingAction,
  uploadOrganizationBrandingAction,
} from "@/app/actions/organization.actions";
import { ApiError } from "@/lib/react-query/types";
import {
  Organization,
  OrganizationRole,
  OrganizationMember,
} from "@/types/organization/organization.types";

export interface CreateOrganizationInput {
  name: string;
  website?: string;
  phone?: string;
  country?: string;
}

export interface Invitation {
  code: string;
  role: OrganizationRole;
  expiresAt: string;
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const result = await listOrganizationsAction();
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.organizations;
}

export async function fetchMembers(): Promise<OrganizationMember[]> {
  const result = await listMembersAction();
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.members;
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<void> {
  const result = await createOrganizationAction(
    input.name.trim(),
    input.website || undefined,
    input.phone || undefined,
    input.country || undefined
  );
  if (!result.success) throw new ApiError(result.error ?? "create_failed");
}

export async function joinOrganization(
  code: string
): Promise<{ tenantName?: string }> {
  const result = await joinOrganizationAction(code.trim());
  if (!result.success) throw new ApiError(result.error ?? "join_failed");
  return { tenantName: result.tenantName };
}

export async function switchOrganization(tenantId: string): Promise<void> {
  const result = await switchOrganizationAction(tenantId);
  if (!result.success) throw new ApiError(result.error ?? "switch_failed");
}

export async function createInvitation(
  role: OrganizationRole
): Promise<Invitation> {
  const result = await createInvitationAction(role);
  if (!result.success || !result.invitation) {
    throw new ApiError(result.error ?? "invitation_failed");
  }
  return result.invitation;
}

export async function updateMemberRole(params: {
  userId: string;
  role: OrganizationRole;
}): Promise<void> {
  const result = await updateMemberRoleAction(params.userId, params.role);
  if (!result.success) throw new ApiError(result.error ?? "update_failed");
}

export interface OrganizationBranding {
  logoUrl: string | null;
  bannerUrl: string | null;
}

export async function fetchOrganizationBranding(): Promise<OrganizationBranding> {
  const result = await getOrganizationBrandingAction();
  if (!result.success || !result.branding) {
    throw new ApiError(result.error ?? "unknown_error");
  }
  return result.branding;
}

export async function uploadOrganizationBranding(params: {
  slot: "logo" | "banner";
  file: File;
}): Promise<string | undefined> {
  const formData = new FormData();
  formData.append("file", params.file);
  const result = await uploadOrganizationBrandingAction(params.slot, formData);
  if (!result.success) throw new ApiError(result.error ?? "upload_failed");
  return result.url;
}
