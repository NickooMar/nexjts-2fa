"use server";

import { signIn } from "@/auth";
import { apiFetch, apiUpload } from "@/lib/api";
import { revalidatePath } from "next/cache";
import {
  Organization,
  OrganizationRole,
  OrganizationMember,
} from "@/types/organization/organization.types";

/**
 * Organizations the current user belongs to (for the org switcher).
 */
export const listOrganizationsAction = async (): Promise<{
  success: boolean;
  organizations: Organization[];
  error?: string;
}> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      organizations: Organization[];
    }>("/organizations");
    return { success: true, organizations: data.organizations ?? [] };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      organizations: [],
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};

/**
 * Switch the active organization. The backend re-issues tokens scoped to the
 * target org (membership validated); we then hand those tokens back to NextAuth
 * via the existing `verified-email` provider to refresh the whole session.
 */
export const switchOrganizationAction = async (
  tenantId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      tokens?: { accessToken: string; refreshToken: string };
    }>("/organizations/switch", { method: "POST", body: { tenantId } });

    if (!data.success || !data.tokens) {
      return { success: false, error: "switch_failed" };
    }

    await signIn("verified-email", {
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      redirect: false,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};

/**
 * Create a new organization for the current (already-authenticated) user.
 * The backend creates the tenant + owner membership and returns tokens scoped
 * to the new org; we refresh the NextAuth session with them so the switcher
 * and all tenant-scoped pages immediately reflect the new active org.
 */
export const createOrganizationAction = async (
  name: string,
  website?: string,
  phone?: string,
  country?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      tenant?: { _id: string; name: string; slug: string };
      tokens?: { accessToken: string; refreshToken: string };
    }>("/organizations", {
      method: "POST",
      body: {
        name,
        ...(website && { website }),
        ...(phone && { phone }),
        ...(country && { country }),
      },
    });

    if (!data.success || !data.tokens) {
      return { success: false, error: "create_failed" };
    }

    await signIn("verified-email", {
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      redirect: false,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};

/**
 * Upload the current organization's logo or banner (owner/admin only). The
 * file travels under the `file` field; replacing an existing image purges the
 * previous object server-side.
 */
export const uploadOrganizationBrandingAction = async (
  slot: "logo" | "banner",
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const data = await apiUpload<{
      success: boolean;
      logoUrl?: string;
      bannerUrl?: string;
    }>(`/organizations/branding/${slot}`, formData, { method: "PUT" });
    revalidatePath("/", "layout");
    return { success: true, url: data.logoUrl ?? data.bannerUrl };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};

/**
 * Current organization's branding (logo/banner URLs), resolved server-side.
 */
export const getOrganizationBrandingAction = async (): Promise<{
  success: boolean;
  branding?: { logoUrl: string | null; bannerUrl: string | null };
  error?: string;
}> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      branding: { logoUrl: string | null; bannerUrl: string | null };
    }>("/organizations/branding");
    return { success: true, branding: data.branding };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};

/**
 * Join an existing organization with an invitation code. On success the
 * session is refreshed with tokens scoped to the joined org.
 */
export const joinOrganizationAction = async (
  code: string
): Promise<{ success: boolean; tenantName?: string; error?: string }> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      tenant?: { _id: string; name: string; slug: string } | null;
      tokens?: { accessToken: string; refreshToken: string };
    }>("/organizations/join", { method: "POST", body: { code } });

    if (!data.success || !data.tokens) {
      return { success: false, error: "join_failed" };
    }

    await signIn("verified-email", {
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      redirect: false,
    });

    revalidatePath("/", "layout");
    return { success: true, tenantName: data.tenant?.name };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};

/**
 * Generate an invitation code for the current organization (owner/admin only).
 */
export const createInvitationAction = async (
  role: OrganizationRole = "member"
): Promise<{
  success: boolean;
  invitation?: { code: string; role: OrganizationRole; expiresAt: string };
  error?: string;
}> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      invitation: { code: string; role: OrganizationRole; expiresAt: string };
    }>("/organizations/invitations", { method: "POST", body: { role } });
    return { success: data.success, invitation: data.invitation };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};

/**
 * Members of the caller's current organization.
 */
export const listMembersAction = async (): Promise<{
  success: boolean;
  members: OrganizationMember[];
  error?: string;
}> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      members: OrganizationMember[];
    }>("/organizations/members");
    return { success: true, members: data.members ?? [] };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      members: [],
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};

/**
 * Change another member's role (owner/admin only — enforced server-side).
 */
export const updateMemberRoleAction = async (
  userId: string,
  role: OrganizationRole
): Promise<{ success: boolean; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean }>(
      "/organizations/members/role",
      { method: "PATCH", body: { userId, role } }
    );
    revalidatePath("/", "layout");
    return { success: data.success };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
};
