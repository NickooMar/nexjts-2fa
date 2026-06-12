"use server";

import { apiFetch, apiUpload } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { MediaAsset } from "@/types/property/property.types";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "unknown_error";

/**
 * Upload one or more property images. `formData` carries the files under the
 * `files` field; the gateway validates type/size/limits, stores the bytes in
 * S3/MinIO and persists metadata in the tenant database.
 */
export const uploadPropertyImagesAction = async (
  idOrSlug: string,
  formData: FormData
): Promise<{ success: boolean; images?: MediaAsset[]; error?: string }> => {
  try {
    const data = await apiUpload<{ success: boolean; images: MediaAsset[] }>(
      `/properties/${encodeURIComponent(idOrSlug)}/images`,
      formData
    );
    revalidatePath(`/properties/${idOrSlug}`);
    return { success: true, images: data.images };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Upload one or more property documents (PDF, DOCX, XLSX, …).
 */
export const uploadPropertyDocumentsAction = async (
  idOrSlug: string,
  formData: FormData
): Promise<{ success: boolean; documents?: MediaAsset[]; error?: string }> => {
  try {
    const data = await apiUpload<{ success: boolean; documents: MediaAsset[] }>(
      `/properties/${encodeURIComponent(idOrSlug)}/documents`,
      formData
    );
    revalidatePath(`/properties/${idOrSlug}`);
    return { success: true, documents: data.documents };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Delete a media asset (image or document): removes both the stored object
 * and its metadata. Deleting the cover promotes the next image server-side.
 */
export const deletePropertyMediaAction = async (
  idOrSlug: string,
  mediaId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch<{ success: boolean }>(
      `/properties/${encodeURIComponent(idOrSlug)}/media/${encodeURIComponent(mediaId)}`,
      { method: "DELETE" }
    );
    revalidatePath(`/properties/${idOrSlug}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Persist a new gallery order (index in `orderedIds` = display position).
 */
export const reorderPropertyImagesAction = async (
  idOrSlug: string,
  orderedIds: string[]
): Promise<{ success: boolean; images?: MediaAsset[]; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; images: MediaAsset[] }>(
      `/properties/${encodeURIComponent(idOrSlug)}/images/reorder`,
      { method: "PATCH", body: { orderedIds } }
    );
    revalidatePath(`/properties/${idOrSlug}`);
    return { success: true, images: data.images };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Mark an image as the property's cover (shown on list cards).
 */
export const setPropertyCoverAction = async (
  idOrSlug: string,
  mediaId: string
): Promise<{ success: boolean; image?: MediaAsset; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; image: MediaAsset }>(
      `/properties/${encodeURIComponent(idOrSlug)}/images/${encodeURIComponent(mediaId)}/cover`,
      { method: "PATCH" }
    );
    revalidatePath(`/properties/${idOrSlug}`);
    revalidatePath("/properties");
    return { success: true, image: data.image };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Fresh download URL for a document (signed URLs expire, so one is minted per
 * download with `attachment` disposition and the original filename).
 */
export const getDocumentDownloadUrlAction = async (
  idOrSlug: string,
  mediaId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; url: string }>(
      `/properties/${encodeURIComponent(idOrSlug)}/documents/${encodeURIComponent(mediaId)}/download`
    );
    return { success: true, url: data.url };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};
