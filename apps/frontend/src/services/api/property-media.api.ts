/**
 * Client-side service layer for property media. Mirrors properties.api.ts:
 * server actions are the transport, and `{ success, error }` envelopes are
 * unwrapped into thrown ApiErrors so React Query can drive retry/error state.
 */

import {
  setPropertyCoverAction,
  deletePropertyMediaAction,
  uploadPropertyImagesAction,
  reorderPropertyImagesAction,
  uploadPropertyDocumentsAction,
  getDocumentDownloadUrlAction,
} from "@/app/actions/property-media.actions";
import { ApiError } from "@/lib/react-query/types";
import { MediaAsset } from "@/types/property/property.types";

function toFormData(files: File[]): FormData {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  return formData;
}

export async function uploadPropertyImages(params: {
  idOrSlug: string;
  files: File[];
}): Promise<MediaAsset[]> {
  const result = await uploadPropertyImagesAction(
    params.idOrSlug,
    toFormData(params.files)
  );
  if (!result.success || !result.images) {
    throw new ApiError(result.error ?? "upload_failed");
  }
  return result.images;
}

export async function uploadPropertyDocuments(params: {
  idOrSlug: string;
  files: File[];
}): Promise<MediaAsset[]> {
  const result = await uploadPropertyDocumentsAction(
    params.idOrSlug,
    toFormData(params.files)
  );
  if (!result.success || !result.documents) {
    throw new ApiError(result.error ?? "upload_failed");
  }
  return result.documents;
}

export async function deletePropertyMedia(params: {
  idOrSlug: string;
  mediaId: string;
}): Promise<void> {
  const result = await deletePropertyMediaAction(
    params.idOrSlug,
    params.mediaId
  );
  if (!result.success) throw new ApiError(result.error ?? "delete_failed");
}

export async function reorderPropertyImages(params: {
  idOrSlug: string;
  orderedIds: string[];
}): Promise<MediaAsset[]> {
  const result = await reorderPropertyImagesAction(
    params.idOrSlug,
    params.orderedIds
  );
  if (!result.success || !result.images) {
    throw new ApiError(result.error ?? "reorder_failed");
  }
  return result.images;
}

export async function setPropertyCover(params: {
  idOrSlug: string;
  mediaId: string;
}): Promise<MediaAsset> {
  const result = await setPropertyCoverAction(params.idOrSlug, params.mediaId);
  if (!result.success || !result.image) {
    throw new ApiError(result.error ?? "set_cover_failed");
  }
  return result.image;
}

export async function getDocumentDownloadUrl(params: {
  idOrSlug: string;
  mediaId: string;
}): Promise<string> {
  const result = await getDocumentDownloadUrlAction(
    params.idOrSlug,
    params.mediaId
  );
  if (!result.success || !result.url) {
    throw new ApiError(result.error ?? "download_failed");
  }
  return result.url;
}
