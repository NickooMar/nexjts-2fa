"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  createOwner,
  attachOwners,
  detachOwner,
} from "@/services/api/owners.api";
import { PropertyOwner } from "@/types/property/owner.types";

/**
 * Owner association mutations for the property detail page (the edit surface).
 * Toast copy is passed by the caller and dispatched via `meta` — see
 * query-client.ts. After each change both the property-scoped owner list and
 * the global roster are invalidated so pickers stay fresh.
 */
interface MutationMessages {
  successMessage?: string;
  errorMessage?: string;
  errorMessages?: Record<string, string>;
}

/** Invalidate the per-property owner list + the org-wide roster. */
function useInvalidateOwners() {
  const queryClient = useQueryClient();
  return (propertyIdOrSlug: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.owners.byProperty(propertyIdOrSlug),
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.owners.lists() });
  };
}

/** Attach one or more existing owners to a property. */
export function useAttachOwners(
  options?: MutationMessages & { onSuccess?: (owners: PropertyOwner[]) => void }
) {
  const invalidate = useInvalidateOwners();

  return useMutation({
    mutationFn: attachOwners,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: (owners, { propertyIdOrSlug }) => {
      invalidate(propertyIdOrSlug);
      options?.onSuccess?.(owners);
    },
  });
}

/** Create a brand-new owner, attached to the property in the same call. */
export function useCreatePropertyOwner(
  options?: MutationMessages & { onSuccess?: (owner: PropertyOwner) => void }
) {
  const invalidate = useInvalidateOwners();

  return useMutation({
    mutationFn: (params: {
      input: Parameters<typeof createOwner>[0]["input"];
      propertyId: string;
      propertyIdOrSlug: string;
    }) => createOwner({ input: params.input, propertyId: params.propertyId }),
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: (owner, { propertyIdOrSlug }) => {
      invalidate(propertyIdOrSlug);
      options?.onSuccess?.(owner);
    },
  });
}

/** Detach an owner from a property (their roster record survives). */
export function useDetachOwner(
  options?: MutationMessages & { onSuccess?: () => void }
) {
  const invalidate = useInvalidateOwners();

  return useMutation({
    mutationFn: detachOwner,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: (_data, { propertyIdOrSlug }) => {
      invalidate(propertyIdOrSlug);
      options?.onSuccess?.();
    },
  });
}
