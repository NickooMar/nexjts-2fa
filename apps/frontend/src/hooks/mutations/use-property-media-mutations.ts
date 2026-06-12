"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  setPropertyCover,
  deletePropertyMedia,
  uploadPropertyImages,
  reorderPropertyImages,
  uploadPropertyDocuments,
} from "@/services/api/property-media.api";
import { MediaAsset, Property } from "@/types/property/property.types";

/**
 * Media mutations for one property (identified by `idOrSlug`, matching the
 * detail query key). Toast messages flow through `meta` like every other
 * mutation; cache writes patch the detail entry in place and invalidate the
 * list (cover image may have changed).
 */
interface MutationMessages {
  successMessage?: string;
  errorMessage?: string;
  errorMessages?: Record<string, string>;
}

/** Patch the cached property detail in place (no refetch flicker). */
function usePatchPropertyDetail(idOrSlug: string) {
  const queryClient = useQueryClient();
  return (patch: (property: Property) => Property) => {
    const detailKey = queryKeys.properties.detail(idOrSlug);
    const current = queryClient.getQueryData<Property>(detailKey);
    if (current) queryClient.setQueryData(detailKey, patch(current));
  };
}

export function useUploadPropertyImages(
  idOrSlug: string,
  options?: MutationMessages & { onSuccess?: (images: MediaAsset[]) => void }
) {
  const queryClient = useQueryClient();
  const patchDetail = usePatchPropertyDetail(idOrSlug);

  return useMutation({
    mutationFn: (files: File[]) => uploadPropertyImages({ idOrSlug, files }),
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: (newImages) => {
      patchDetail((property) => {
        const images = [...(property.images ?? []), ...newImages];
        return {
          ...property,
          images,
          coverImage:
            property.coverImage ??
            images.find((image) => image.isCover) ??
            images[0] ??
            null,
        };
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.lists() });
      options?.onSuccess?.(newImages);
    },
  });
}

export function useUploadPropertyDocuments(
  idOrSlug: string,
  options?: MutationMessages & {
    onSuccess?: (documents: MediaAsset[]) => void;
  }
) {
  const patchDetail = usePatchPropertyDetail(idOrSlug);

  return useMutation({
    mutationFn: (files: File[]) => uploadPropertyDocuments({ idOrSlug, files }),
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: (newDocuments) => {
      patchDetail((property) => ({
        ...property,
        documents: [...(property.documents ?? []), ...newDocuments],
      }));
      options?.onSuccess?.(newDocuments);
    },
  });
}

export function useDeletePropertyMedia(
  idOrSlug: string,
  options?: MutationMessages & { onSuccess?: () => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: string) => deletePropertyMedia({ idOrSlug, mediaId }),
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    // Optimistic removal from both galleries, restored from snapshot on error.
    onMutate: async (mediaId) => {
      const detailKey = queryKeys.properties.detail(idOrSlug);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Property>(detailKey);

      if (previous) {
        const images = (previous.images ?? []).filter(
          (image) => image._id !== mediaId
        );
        queryClient.setQueryData<Property>(detailKey, {
          ...previous,
          images,
          documents: (previous.documents ?? []).filter(
            (document) => document._id !== mediaId
          ),
          // Deleting the cover promotes the next image server-side; mirror it.
          coverImage:
            previous.coverImage?._id === mediaId
              ? (images.find((image) => image.isCover) ?? images[0] ?? null)
              : previous.coverImage,
        });
      }
      return { previous, detailKey };
    },
    onError: (_error, _mediaId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.detailKey, context.previous);
      }
    },
    onSuccess: () => options?.onSuccess?.(),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.detail(idOrSlug),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.lists() });
    },
  });
}

export function useReorderPropertyImages(
  idOrSlug: string,
  options?: MutationMessages
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderPropertyImages({ idOrSlug, orderedIds }),
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    // Optimistic reorder so drag-and-drop feels instant.
    onMutate: async (orderedIds) => {
      const detailKey = queryKeys.properties.detail(idOrSlug);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Property>(detailKey);

      if (previous?.images) {
        const byId = new Map(
          previous.images.map((image) => [image._id, image])
        );
        const reordered = orderedIds
          .map((id) => byId.get(id))
          .filter((image): image is MediaAsset => Boolean(image));
        queryClient.setQueryData<Property>(detailKey, {
          ...previous,
          images: reordered.map((image, index) => ({ ...image, order: index })),
        });
      }
      return { previous, detailKey };
    },
    onError: (_error, _orderedIds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.detailKey, context.previous);
      }
    },
    onSuccess: (images) => {
      const detailKey = queryKeys.properties.detail(idOrSlug);
      const current = queryClient.getQueryData<Property>(detailKey);
      if (current) queryClient.setQueryData(detailKey, { ...current, images });
    },
  });
}

export function useSetPropertyCover(
  idOrSlug: string,
  options?: MutationMessages
) {
  const queryClient = useQueryClient();
  const patchDetail = usePatchPropertyDetail(idOrSlug);

  return useMutation({
    mutationFn: (mediaId: string) => setPropertyCover({ idOrSlug, mediaId }),
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: (cover) => {
      patchDetail((property) => ({
        ...property,
        coverImage: cover,
        images: (property.images ?? []).map((image) => ({
          ...image,
          isCover: image._id === cover._id,
        })),
      }));
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.lists() });
    },
  });
}
