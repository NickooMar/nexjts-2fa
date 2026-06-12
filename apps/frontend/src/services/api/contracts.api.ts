/**
 * Client-side service layer for property contracts. Server actions are the
 * transport; this layer unwraps their `{ success, error }` envelopes and
 * throws ApiError so React Query can drive retries and error states.
 */

import {
  listContractsAction,
  createContractAction,
  updateContractAction,
  deleteContractAction,
  uploadContractImagesAction,
  uploadContractDocumentsAction,
} from "@/app/actions/contract.actions";
import { ApiError } from "@/lib/react-query/types";
import { MediaAsset } from "@/types/property/property.types";
import {
  Contract,
  CreateContractInput,
  UpdateContractInput,
} from "@/types/property/contract.types";

export async function fetchContracts(
  propertyIdOrSlug: string
): Promise<Contract[]> {
  const result = await listContractsAction(propertyIdOrSlug);
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.contracts;
}

export async function createContract(params: {
  propertyIdOrSlug: string;
  input: CreateContractInput;
}): Promise<Contract> {
  const result = await createContractAction(
    params.propertyIdOrSlug,
    params.input
  );
  if (!result.success || !result.contract) {
    throw new ApiError(result.error ?? "create_failed");
  }
  return result.contract;
}

export async function updateContract(params: {
  propertyIdOrSlug: string;
  contractId: string;
  input: UpdateContractInput;
}): Promise<Contract> {
  const result = await updateContractAction(
    params.propertyIdOrSlug,
    params.contractId,
    params.input
  );
  if (!result.success || !result.contract) {
    throw new ApiError(result.error ?? "update_failed");
  }
  return result.contract;
}

export async function deleteContract(params: {
  propertyIdOrSlug: string;
  contractId: string;
}): Promise<void> {
  const result = await deleteContractAction(
    params.propertyIdOrSlug,
    params.contractId
  );
  if (!result.success) throw new ApiError(result.error ?? "delete_failed");
}

export async function uploadContractImages(params: {
  propertyIdOrSlug: string;
  contractId: string;
  files: File[];
}): Promise<MediaAsset[]> {
  const formData = new FormData();
  params.files.forEach((file) => formData.append("files", file));
  const result = await uploadContractImagesAction(
    params.propertyIdOrSlug,
    params.contractId,
    formData
  );
  if (!result.success || !result.images) {
    throw new ApiError(result.error ?? "upload_failed");
  }
  return result.images;
}

export async function uploadContractDocuments(params: {
  propertyIdOrSlug: string;
  contractId: string;
  files: File[];
}): Promise<MediaAsset[]> {
  const formData = new FormData();
  params.files.forEach((file) => formData.append("files", file));
  const result = await uploadContractDocumentsAction(
    params.propertyIdOrSlug,
    params.contractId,
    formData
  );
  if (!result.success || !result.documents) {
    throw new ApiError(result.error ?? "upload_failed");
  }
  return result.documents;
}
