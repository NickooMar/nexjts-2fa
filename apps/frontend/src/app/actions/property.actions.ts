"use server";

import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";
import {
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
} from "@/types/property/property.types";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "unknown_error";

/**
 * List the current tenant's properties. The tenant is resolved server-side from
 * the session's access token, so callers never pass a tenant id.
 */
export const listPropertiesAction = async (): Promise<{
  success: boolean;
  properties: Property[];
  error?: string;
}> => {
  try {
    const data = await apiFetch<{ success: boolean; properties: Property[] }>(
      "/properties"
    );
    return { success: true, properties: data.properties ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, properties: [], error: errorMessage(error) };
  }
};

/**
 * Fetch a single property by Mongo id, public uuid, or slug.
 */
export const getPropertyAction = async (
  idOrSlug: string
): Promise<{ success: boolean; property?: Property; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; property: Property }>(
      `/properties/${encodeURIComponent(idOrSlug)}`
    );
    return { success: true, property: data.property };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Create a property in the current tenant's database.
 */
export const createPropertyAction = async (
  input: CreatePropertyInput
): Promise<{ success: boolean; property?: Property; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; property: Property }>(
      "/properties",
      { method: "POST", body: input }
    );
    revalidatePath("/properties");
    return { success: true, property: data.property };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Update a property. Renaming regenerates the slug server-side, so callers
 * should navigate using the returned property.
 */
export const updatePropertyAction = async (
  idOrSlug: string,
  input: UpdatePropertyInput
): Promise<{ success: boolean; property?: Property; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; property: Property }>(
      `/properties/${encodeURIComponent(idOrSlug)}`,
      { method: "PATCH", body: input }
    );
    revalidatePath("/properties");
    revalidatePath(`/properties/${idOrSlug}`);
    return { success: true, property: data.property };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Delete a property from the current tenant's database.
 */
export const deletePropertyAction = async (
  idOrSlug: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch<{ success: boolean; deleted: boolean }>(
      `/properties/${encodeURIComponent(idOrSlug)}`,
      { method: "DELETE" }
    );
    revalidatePath("/properties");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};
