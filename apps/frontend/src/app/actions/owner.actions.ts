"use server";

import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";
import {
  PropertyOwner,
  CreatePropertyOwnerInput,
  UpdatePropertyOwnerInput,
} from "@/types/property/owner.types";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "unknown_error";

/**
 * List the organization's whole property-owner roster (used to pick existing
 * owners when creating a property).
 */
export const listOwnersAction = async (): Promise<{
  success: boolean;
  owners: PropertyOwner[];
  error?: string;
}> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      owners: PropertyOwner[];
    }>("/owners");
    return { success: true, owners: data.owners ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, owners: [], error: errorMessage(error) };
  }
};

/**
 * List the owners currently attached to a property.
 */
export const listPropertyOwnersAction = async (
  propertyIdOrSlug: string
): Promise<{ success: boolean; owners: PropertyOwner[]; error?: string }> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      owners: PropertyOwner[];
    }>(`/properties/${encodeURIComponent(propertyIdOrSlug)}/owners`);
    return { success: true, owners: data.owners ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, owners: [], error: errorMessage(error) };
  }
};

/**
 * Create an owner. Passing `propertyId` also attaches them to that property.
 */
export const createOwnerAction = async (
  input: CreatePropertyOwnerInput,
  propertyId?: string
): Promise<{ success: boolean; owner?: PropertyOwner; error?: string }> => {
  try {
    const query = propertyId
      ? `?propertyId=${encodeURIComponent(propertyId)}`
      : "";
    const data = await apiFetch<{ success: boolean; owner: PropertyOwner }>(
      `/owners${query}`,
      { method: "POST", body: input }
    );
    return { success: true, owner: data.owner };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Update an owner's personal details.
 */
export const updateOwnerAction = async (
  ownerId: string,
  input: UpdatePropertyOwnerInput
): Promise<{ success: boolean; owner?: PropertyOwner; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; owner: PropertyOwner }>(
      `/owners/${encodeURIComponent(ownerId)}`,
      { method: "PATCH", body: input }
    );
    return { success: true, owner: data.owner };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Attach existing owners to a property; returns the updated owner roster.
 */
export const attachOwnersAction = async (
  propertyIdOrSlug: string,
  ownerIds: string[]
): Promise<{ success: boolean; owners?: PropertyOwner[]; error?: string }> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      owners: PropertyOwner[];
    }>(`/properties/${encodeURIComponent(propertyIdOrSlug)}/owners/attach`, {
      method: "POST",
      body: { ownerIds },
    });
    revalidatePath(`/properties/${propertyIdOrSlug}`);
    return { success: true, owners: data.owners };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Detach an owner from a property (their record survives in the roster).
 */
export const detachOwnerAction = async (
  propertyIdOrSlug: string,
  ownerId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch<{ success: boolean }>(
      `/properties/${encodeURIComponent(propertyIdOrSlug)}/owners/${encodeURIComponent(ownerId)}`,
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
 * Permanently delete an owner from the organization's roster.
 */
export const deleteOwnerAction = async (
  ownerId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch<{ success: boolean }>(
      `/owners/${encodeURIComponent(ownerId)}`,
      { method: "DELETE" }
    );
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};
