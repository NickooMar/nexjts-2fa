"use server";

import { apiFetch, apiUpload } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { MediaAsset } from "@/types/property/property.types";
import {
  Contract,
  CreateContractInput,
  UpdateContractInput,
} from "@/types/property/contract.types";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "unknown_error";

/**
 * List a property's contracts (media storage keys already resolved to URLs).
 */
export const listContractsAction = async (
  propertyIdOrSlug: string
): Promise<{ success: boolean; contracts: Contract[]; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; contracts: Contract[] }>(
      `/properties/${encodeURIComponent(propertyIdOrSlug)}/contracts`
    );
    return { success: true, contracts: data.contracts ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, contracts: [], error: errorMessage(error) };
  }
};

/**
 * Create a contract attached to a property.
 */
export const createContractAction = async (
  propertyIdOrSlug: string,
  input: CreateContractInput
): Promise<{ success: boolean; contract?: Contract; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; contract: Contract }>(
      `/properties/${encodeURIComponent(propertyIdOrSlug)}/contracts`,
      { method: "POST", body: input }
    );
    revalidatePath(`/properties/${propertyIdOrSlug}`);
    return { success: true, contract: data.contract };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Update a contract's details.
 */
export const updateContractAction = async (
  propertyIdOrSlug: string,
  contractId: string,
  input: UpdateContractInput
): Promise<{ success: boolean; contract?: Contract; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; contract: Contract }>(
      `/properties/${encodeURIComponent(propertyIdOrSlug)}/contracts/${encodeURIComponent(contractId)}`,
      { method: "PATCH", body: input }
    );
    revalidatePath(`/properties/${propertyIdOrSlug}`);
    return { success: true, contract: data.contract };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Delete a contract (its stored files are purged server-side).
 */
export const deleteContractAction = async (
  propertyIdOrSlug: string,
  contractId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch<{ success: boolean }>(
      `/properties/${encodeURIComponent(propertyIdOrSlug)}/contracts/${encodeURIComponent(contractId)}`,
      { method: "DELETE" }
    );
    revalidatePath(`/properties/${propertyIdOrSlug}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Upload scanned contract images. `formData` carries the files under `files`.
 */
export const uploadContractImagesAction = async (
  propertyIdOrSlug: string,
  contractId: string,
  formData: FormData
): Promise<{ success: boolean; images?: MediaAsset[]; error?: string }> => {
  try {
    const data = await apiUpload<{ success: boolean; images: MediaAsset[] }>(
      `/properties/${encodeURIComponent(propertyIdOrSlug)}/contracts/${encodeURIComponent(contractId)}/images`,
      formData
    );
    revalidatePath(`/properties/${propertyIdOrSlug}`);
    return { success: true, images: data.images };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Upload contract documents (PDF, DOCX, XLSX, …).
 */
export const uploadContractDocumentsAction = async (
  propertyIdOrSlug: string,
  contractId: string,
  formData: FormData
): Promise<{ success: boolean; documents?: MediaAsset[]; error?: string }> => {
  try {
    const data = await apiUpload<{ success: boolean; documents: MediaAsset[] }>(
      `/properties/${encodeURIComponent(propertyIdOrSlug)}/contracts/${encodeURIComponent(contractId)}/documents`,
      formData
    );
    revalidatePath(`/properties/${propertyIdOrSlug}`);
    return { success: true, documents: data.documents };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Fresh download URL for a contract document (signed URLs expire).
 */
export const getContractDocumentDownloadUrlAction = async (
  propertyIdOrSlug: string,
  contractId: string,
  mediaId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; url: string }>(
      `/properties/${encodeURIComponent(propertyIdOrSlug)}/contracts/${encodeURIComponent(contractId)}/documents/${encodeURIComponent(mediaId)}/download`
    );
    return { success: true, url: data.url };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};
