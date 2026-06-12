"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  joinOrganization,
  createInvitation,
  updateMemberRole,
  createOrganization,
  switchOrganization,
  uploadOrganizationBranding,
} from "@/services/api/organizations.api";

interface MutationMessages {
  successMessage?: string;
  errorMessage?: string;
  errorMessages?: Record<string, string>;
}

/**
 * Create / join / switch all re-issue tenant-scoped tokens server-side, so on
 * success we must (1) refresh the NextAuth client session, (2) clear the query
 * cache — every tenant-scoped entry (properties, members, ...) belongs to the
 * previous organization — and (3) refresh server components.
 */
function useTenantChangedEffect() {
  const router = useRouter();
  const { update } = useSession();
  const queryClient = useQueryClient();

  return async () => {
    await update();
    queryClient.clear();
    router.refresh();
  };
}

export function useCreateOrganization(
  options?: MutationMessages & { onSuccess?: () => void }
) {
  const onTenantChanged = useTenantChangedEffect();

  return useMutation({
    mutationFn: createOrganization,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: async () => {
      await onTenantChanged();
      options?.onSuccess?.();
    },
  });
}

export function useJoinOrganization(
  options?: MutationMessages & {
    onSuccess?: (result: { tenantName?: string }) => void;
  }
) {
  const onTenantChanged = useTenantChangedEffect();

  return useMutation({
    mutationFn: joinOrganization,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: async (result) => {
      await onTenantChanged();
      options?.onSuccess?.(result);
    },
  });
}

export function useSwitchOrganization(
  options?: MutationMessages & { onSuccess?: () => void }
) {
  const onTenantChanged = useTenantChangedEffect();

  return useMutation({
    mutationFn: switchOrganization,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: async () => {
      await onTenantChanged();
      options?.onSuccess?.();
    },
  });
}

/**
 * Upload the current organization's logo or banner. Used right after
 * creating an organization (the session already points at the new tenant)
 * and from any future org-settings screen.
 */
export function useUploadOrganizationBranding(
  options?: MutationMessages & { onSuccess?: (url?: string) => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadOrganizationBranding,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: (url) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all(),
      });
      options?.onSuccess?.(url);
    },
  });
}

export function useCreateInvitation(options?: MutationMessages) {
  return useMutation({
    mutationFn: createInvitation,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
  });
}

export function useUpdateMemberRole(
  options?: MutationMessages & { onSuccess?: () => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMemberRole,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.memberships.all(),
      });
      options?.onSuccess?.();
    },
  });
}
