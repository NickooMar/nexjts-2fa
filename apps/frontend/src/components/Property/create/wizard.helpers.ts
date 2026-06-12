import { ContractFormState } from "@/schemas/contract.schema";
import { TenantFormState } from "@/schemas/tenant.schema";
import { CreateContractInput } from "@/types/property/contract.types";
import { CreatePropertyTenantInput } from "@/types/property/tenant.types";

/** A locally selected image, previewable before anything is uploaded. */
export interface ImageDraft {
  id: string;
  file: File;
  previewUrl: string;
}

/** A locally selected document (no preview, just metadata). */
export interface FileDraft {
  id: string;
  file: File;
}

/** A contract collected by step 2, with its files, pending submission. */
export interface ContractDraft {
  id: string;
  values: ContractFormState;
  images: ImageDraft[];
  documents: FileDraft[];
}

/** A brand-new tenant collected by step 3, pending submission. */
export interface NewTenantDraft {
  id: string;
  values: TenantFormState;
}

let draftSequence = 0;
/** Stable local ids for list keys (never sent to the backend). */
export const nextDraftId = () => `draft-${++draftSequence}`;

export const toImageDrafts = (files: File[]): ImageDraft[] =>
  files.map((file) => ({
    id: nextDraftId(),
    file,
    previewUrl: URL.createObjectURL(file),
  }));

export const toFileDrafts = (files: File[]): FileDraft[] =>
  files.map((file) => ({ id: nextDraftId(), file }));

export const revokeImageDrafts = (drafts: ImageDraft[]) => {
  for (const draft of drafts) URL.revokeObjectURL(draft.previewUrl);
};

/** Map contract form values to the API payload, dropping empty fields. */
export function toContractInput(values: ContractFormState): CreateContractInput {
  return {
    title: values.title.trim(),
    type: values.type,
    status: values.status,
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
    amount: values.amount ? Number(values.amount) : undefined,
    currency: values.currency || undefined,
    paymentFrequency: values.paymentFrequency || undefined,
    deposit: values.deposit ? Number(values.deposit) : undefined,
    notes: values.notes?.trim() || undefined,
  };
}

/** Map tenant form values to the API payload, dropping empty fields. */
export function toTenantInput(
  values: TenantFormState
): CreatePropertyTenantInput {
  return {
    fullName: values.fullName.trim(),
    email: values.email?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    documentId: values.documentId?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  };
}
