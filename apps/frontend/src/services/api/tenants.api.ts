/**
 * Client-side service layer for property tenants (renters). Server actions
 * are the transport; this layer unwraps their `{ success, error }` envelopes
 * and throws ApiError so React Query can drive retries and error states.
 */

import {
  listTenantsAction,
  createTenantAction,
  updateTenantAction,
  deleteTenantAction,
  attachTenantsAction,
  detachTenantAction,
  listPropertyTenantsAction,
} from "@/app/actions/tenant.actions";
import { ApiError } from "@/lib/react-query/types";
import {
  PropertyTenant,
  CreatePropertyTenantInput,
  UpdatePropertyTenantInput,
} from "@/types/property/tenant.types";

export async function fetchTenants(): Promise<PropertyTenant[]> {
  const result = await listTenantsAction();
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.tenants;
}

export async function fetchPropertyTenants(
  propertyIdOrSlug: string
): Promise<PropertyTenant[]> {
  const result = await listPropertyTenantsAction(propertyIdOrSlug);
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.tenants;
}

export async function createTenant(params: {
  input: CreatePropertyTenantInput;
  /** Attach the new tenant to this property on create. */
  propertyId?: string;
}): Promise<PropertyTenant> {
  const result = await createTenantAction(params.input, params.propertyId);
  if (!result.success || !result.tenant) {
    throw new ApiError(result.error ?? "create_failed");
  }
  return result.tenant;
}

export async function updateTenant(params: {
  tenantId: string;
  input: UpdatePropertyTenantInput;
}): Promise<PropertyTenant> {
  const result = await updateTenantAction(params.tenantId, params.input);
  if (!result.success || !result.tenant) {
    throw new ApiError(result.error ?? "update_failed");
  }
  return result.tenant;
}

export async function attachTenants(params: {
  propertyIdOrSlug: string;
  tenantIds: string[];
}): Promise<PropertyTenant[]> {
  const result = await attachTenantsAction(
    params.propertyIdOrSlug,
    params.tenantIds
  );
  if (!result.success || !result.tenants) {
    throw new ApiError(result.error ?? "attach_failed");
  }
  return result.tenants;
}

export async function detachTenant(params: {
  propertyIdOrSlug: string;
  tenantId: string;
}): Promise<void> {
  const result = await detachTenantAction(
    params.propertyIdOrSlug,
    params.tenantId
  );
  if (!result.success) throw new ApiError(result.error ?? "detach_failed");
}

export async function deleteTenant(tenantId: string): Promise<void> {
  const result = await deleteTenantAction(tenantId);
  if (!result.success) throw new ApiError(result.error ?? "delete_failed");
}
