/**
 * Client-side service layer for property owners. Server actions are the
 * transport; this layer unwraps their `{ success, error }` envelopes and
 * throws ApiError so React Query can drive retries and error states.
 */

import {
  listOwnersAction,
  createOwnerAction,
  updateOwnerAction,
  deleteOwnerAction,
  attachOwnersAction,
  detachOwnerAction,
  listPropertyOwnersAction,
} from "@/app/actions/owner.actions";
import { ApiError } from "@/lib/react-query/types";
import {
  PropertyOwner,
  CreatePropertyOwnerInput,
  UpdatePropertyOwnerInput,
} from "@/types/property/owner.types";

export async function fetchOwners(): Promise<PropertyOwner[]> {
  const result = await listOwnersAction();
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.owners;
}

export async function fetchPropertyOwners(
  propertyIdOrSlug: string
): Promise<PropertyOwner[]> {
  const result = await listPropertyOwnersAction(propertyIdOrSlug);
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.owners;
}

export async function createOwner(params: {
  input: CreatePropertyOwnerInput;
  /** Attach the new owner to this property on create. */
  propertyId?: string;
}): Promise<PropertyOwner> {
  const result = await createOwnerAction(params.input, params.propertyId);
  if (!result.success || !result.owner) {
    throw new ApiError(result.error ?? "create_failed");
  }
  return result.owner;
}

export async function updateOwner(params: {
  ownerId: string;
  input: UpdatePropertyOwnerInput;
}): Promise<PropertyOwner> {
  const result = await updateOwnerAction(params.ownerId, params.input);
  if (!result.success || !result.owner) {
    throw new ApiError(result.error ?? "update_failed");
  }
  return result.owner;
}

export async function attachOwners(params: {
  propertyIdOrSlug: string;
  ownerIds: string[];
}): Promise<PropertyOwner[]> {
  const result = await attachOwnersAction(
    params.propertyIdOrSlug,
    params.ownerIds
  );
  if (!result.success || !result.owners) {
    throw new ApiError(result.error ?? "attach_failed");
  }
  return result.owners;
}

export async function detachOwner(params: {
  propertyIdOrSlug: string;
  ownerId: string;
}): Promise<void> {
  const result = await detachOwnerAction(
    params.propertyIdOrSlug,
    params.ownerId
  );
  if (!result.success) throw new ApiError(result.error ?? "detach_failed");
}

export async function deleteOwner(ownerId: string): Promise<void> {
  const result = await deleteOwnerAction(ownerId);
  if (!result.success) throw new ApiError(result.error ?? "delete_failed");
}
