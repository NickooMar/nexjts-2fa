"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { createProperty } from "@/services/api/properties.api";
import { uploadPropertyImages } from "@/services/api/property-media.api";
import {
  createContract,
  uploadContractImages,
  uploadContractDocuments,
} from "@/services/api/contracts.api";
import { attachTenants, createTenant } from "@/services/api/tenants.api";
import { attachOwners, createOwner } from "@/services/api/owners.api";
import { Property, CreatePropertyInput } from "@/types/property/property.types";
import { CreateContractInput } from "@/types/property/contract.types";
import { CreatePropertyContactInput } from "@/types/property/contact.types";

/** One contract collected by the wizard: details + its files. */
export interface ContractDraftSubmission {
  input: CreateContractInput;
  images: File[];
  documents: File[];
}

export interface WizardSubmission {
  property: CreatePropertyInput;
  /** Gallery images; the first file becomes the cover. */
  images: File[];
  contracts: ContractDraftSubmission[];
  /** Existing roster tenants to attach. */
  existingTenantIds: string[];
  /** Brand-new tenants, created already attached to the property. */
  newTenants: CreatePropertyContactInput[];
  /** Existing roster owners to attach. */
  existingOwnerIds: string[];
  /** Brand-new owners, created already attached to the property. */
  newOwners: CreatePropertyContactInput[];
}

/** Progress phases surfaced while the submission chain runs. */
export type WizardPhase =
  | "property"
  | "images"
  | "contracts"
  | "tenants"
  | "owners";

/** Non-fatal step failures (the property itself was created). */
export type WizardWarning =
  | "images_failed"
  | "contracts_failed"
  | "tenants_failed"
  | "owners_failed";

export interface WizardResult {
  property: Property;
  warnings: WizardWarning[];
}

/**
 * Runs the full creation chain: property → images → contracts (+ files) →
 * tenants. Only the property creation itself is fatal; later steps degrade
 * to warnings so users land on the (created) property page and can retry the
 * missing pieces from there.
 */
async function submitWizard(
  submission: WizardSubmission,
  onPhase?: (phase: WizardPhase) => void
): Promise<WizardResult> {
  onPhase?.("property");
  const property = await createProperty(submission.property);
  const idOrSlug = property.slug ?? property._id;
  const warnings = new Set<WizardWarning>();

  if (submission.images.length > 0) {
    onPhase?.("images");
    await uploadPropertyImages({ idOrSlug, files: submission.images }).catch(
      () => warnings.add("images_failed")
    );
  }

  if (submission.contracts.length > 0) {
    onPhase?.("contracts");
    for (const draft of submission.contracts) {
      try {
        const contract = await createContract({
          propertyIdOrSlug: idOrSlug,
          input: draft.input,
        });
        if (draft.images.length > 0) {
          await uploadContractImages({
            propertyIdOrSlug: idOrSlug,
            contractId: contract._id,
            files: draft.images,
          });
        }
        if (draft.documents.length > 0) {
          await uploadContractDocuments({
            propertyIdOrSlug: idOrSlug,
            contractId: contract._id,
            files: draft.documents,
          });
        }
      } catch {
        warnings.add("contracts_failed");
      }
    }
  }

  if (
    submission.existingTenantIds.length > 0 ||
    submission.newTenants.length > 0
  ) {
    onPhase?.("tenants");
    if (submission.existingTenantIds.length > 0) {
      await attachTenants({
        propertyIdOrSlug: idOrSlug,
        tenantIds: submission.existingTenantIds,
      }).catch(() => warnings.add("tenants_failed"));
    }
    for (const tenant of submission.newTenants) {
      await createTenant({ input: tenant, propertyId: property._id }).catch(
        () => warnings.add("tenants_failed")
      );
    }
  }

  if (
    submission.existingOwnerIds.length > 0 ||
    submission.newOwners.length > 0
  ) {
    onPhase?.("owners");
    if (submission.existingOwnerIds.length > 0) {
      await attachOwners({
        propertyIdOrSlug: idOrSlug,
        ownerIds: submission.existingOwnerIds,
      }).catch(() => warnings.add("owners_failed"));
    }
    for (const owner of submission.newOwners) {
      await createOwner({ input: owner, propertyId: property._id }).catch(
        () => warnings.add("owners_failed")
      );
    }
  }

  return { property, warnings: [...warnings] };
}

interface MutationMessages {
  successMessage?: string;
  errorMessage?: string;
  errorMessages?: Record<string, string>;
  suppressErrorCodes?: string[];
}

export function useCreatePropertyWizard(
  options?: MutationMessages & {
    onPhase?: (phase: WizardPhase) => void;
    onSuccess?: (result: WizardResult) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submission: WizardSubmission) =>
      submitWizard(submission, options?.onPhase),
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
      suppressErrorCodes: options?.suppressErrorCodes,
    },
    onSuccess: (result) => {
      // The detail payload is intentionally NOT seeded here: media/contracts/
      // tenants were written after the create response, so let the detail
      // page fetch a fresh, complete snapshot.
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.owners.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all() });
      options?.onSuccess?.(result);
    },
  });
}
