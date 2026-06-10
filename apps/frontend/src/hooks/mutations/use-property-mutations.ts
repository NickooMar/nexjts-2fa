"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  createProperty,
  updateProperty,
  deleteProperty,
} from "@/services/api/properties.api";
import { Property } from "@/types/property/property.types";

/**
 * Toast messages are passed by the caller (they need i18n) and dispatched by
 * the global mutation cache via `meta` — see query-client.ts. Cache writes and
 * invalidation live here so every consumer gets them for free.
 */
interface MutationMessages {
  successMessage?: string;
  errorMessage?: string;
  errorMessages?: Record<string, string>;
}

export function useCreateProperty(
  options?: MutationMessages & { onSuccess?: (property: Property) => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProperty,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: (property) => {
      // Seed the detail cache so navigating to the new property is instant.
      queryClient.setQueryData(
        queryKeys.properties.detail(property.slug ?? property._id),
        property
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.lists(),
      });
      options?.onSuccess?.(property);
    },
  });
}

export function useUpdateProperty(
  options?: MutationMessages & { onSuccess?: (property: Property) => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProperty,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    // Optimistic update: patch the cached detail and list entries immediately,
    // roll back from the snapshot if the server rejects the change.
    onMutate: async ({ idOrSlug, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.properties.all() });

      const detailKey = queryKeys.properties.detail(idOrSlug);
      const previousDetail = queryClient.getQueryData<Property>(detailKey);
      const previousList = queryClient.getQueryData<Property[]>(
        queryKeys.properties.list()
      );

      if (previousDetail) {
        queryClient.setQueryData<Property>(detailKey, {
          ...previousDetail,
          ...input,
        });
      }
      if (previousList) {
        queryClient.setQueryData<Property[]>(
          queryKeys.properties.list(),
          previousList.map((property) =>
            property.slug === idOrSlug || property._id === idOrSlug
              ? { ...property, ...input }
              : property
          )
        );
      }

      return { previousDetail, previousList, detailKey };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
      if (context?.previousList) {
        queryClient.setQueryData(
          queryKeys.properties.list(),
          context.previousList
        );
      }
    },
    onSuccess: (property, { idOrSlug }) => {
      // Renames regenerate the slug server-side: seed the new detail key with
      // the authoritative server response.
      queryClient.setQueryData(
        queryKeys.properties.detail(property.slug ?? property._id),
        property
      );
      if (property.slug !== idOrSlug) {
        queryClient.removeQueries({
          queryKey: queryKeys.properties.detail(idOrSlug),
        });
      }
      options?.onSuccess?.(property);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.lists(),
      });
    },
  });
}

export function useDeleteProperty(
  options?: MutationMessages & { onSuccess?: () => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProperty,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    // Optimistic removal from the list, restored from snapshot on failure.
    onMutate: async (idOrSlug) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.properties.all() });

      const previousList = queryClient.getQueryData<Property[]>(
        queryKeys.properties.list()
      );
      if (previousList) {
        queryClient.setQueryData<Property[]>(
          queryKeys.properties.list(),
          previousList.filter(
            (property) =>
              property.slug !== idOrSlug && property._id !== idOrSlug
          )
        );
      }

      return { previousList };
    },
    onError: (_error, _idOrSlug, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          queryKeys.properties.list(),
          context.previousList
        );
      }
    },
    onSuccess: (_data, idOrSlug) => {
      queryClient.removeQueries({
        queryKey: queryKeys.properties.detail(idOrSlug),
      });
      options?.onSuccess?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.lists(),
      });
    },
  });
}
