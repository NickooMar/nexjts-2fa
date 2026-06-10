/**
 * Client-side service layer for the properties module.
 *
 * Server actions are the transport (auth tokens never leave the server), but
 * they return `{ success, error }` envelopes. React Query needs thrown errors
 * to drive retries and error states, so each function here unwraps the
 * envelope and throws an ApiError on failure.
 */

import {
  getPropertyAction,
  listPropertiesAction,
  createPropertyAction,
  updatePropertyAction,
  deletePropertyAction,
} from "@/app/actions/property.actions";
import { ApiError } from "@/lib/react-query/types";
import {
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
} from "@/types/property/property.types";

export async function fetchProperties(): Promise<Property[]> {
  const result = await listPropertiesAction();
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.properties;
}

export async function fetchProperty(idOrSlug: string): Promise<Property> {
  const result = await getPropertyAction(idOrSlug);
  if (!result.success || !result.property) {
    throw new ApiError(result.error ?? "property_not_found");
  }
  return result.property;
}

export async function createProperty(
  input: CreatePropertyInput
): Promise<Property> {
  const result = await createPropertyAction(input);
  if (!result.success || !result.property) {
    throw new ApiError(result.error ?? "create_failed");
  }
  return result.property;
}

export async function updateProperty(params: {
  idOrSlug: string;
  input: UpdatePropertyInput;
}): Promise<Property> {
  const result = await updatePropertyAction(params.idOrSlug, params.input);
  if (!result.success || !result.property) {
    throw new ApiError(result.error ?? "update_failed");
  }
  return result.property;
}

export async function deleteProperty(idOrSlug: string): Promise<void> {
  const result = await deletePropertyAction(idOrSlug);
  if (!result.success) throw new ApiError(result.error ?? "delete_failed");
}
