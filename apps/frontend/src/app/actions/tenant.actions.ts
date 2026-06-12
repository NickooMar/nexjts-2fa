"use server";

import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";
import {
  PropertyTenant,
  CreatePropertyTenantInput,
  UpdatePropertyTenantInput,
} from "@/types/property/tenant.types";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "unknown_error";

/**
 * List the organization's whole property-tenant roster (used to pick
 * existing tenants when creating a property).
 */
export const listTenantsAction = async (): Promise<{
  success: boolean;
  tenants: PropertyTenant[];
  error?: string;
}> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      tenants: PropertyTenant[];
    }>("/tenants");
    return { success: true, tenants: data.tenants ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, tenants: [], error: errorMessage(error) };
  }
};

/**
 * List the tenants currently attached to a property.
 */
export const listPropertyTenantsAction = async (
  propertyIdOrSlug: string
): Promise<{ success: boolean; tenants: PropertyTenant[]; error?: string }> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      tenants: PropertyTenant[];
    }>(`/properties/${encodeURIComponent(propertyIdOrSlug)}/tenants`);
    return { success: true, tenants: data.tenants ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, tenants: [], error: errorMessage(error) };
  }
};

/**
 * Create a tenant. Passing `propertyId` also attaches them to that property.
 */
export const createTenantAction = async (
  input: CreatePropertyTenantInput,
  propertyId?: string
): Promise<{ success: boolean; tenant?: PropertyTenant; error?: string }> => {
  try {
    const query = propertyId
      ? `?propertyId=${encodeURIComponent(propertyId)}`
      : "";
    const data = await apiFetch<{ success: boolean; tenant: PropertyTenant }>(
      `/tenants${query}`,
      { method: "POST", body: input }
    );
    return { success: true, tenant: data.tenant };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Update a tenant's personal details.
 */
export const updateTenantAction = async (
  tenantId: string,
  input: UpdatePropertyTenantInput
): Promise<{ success: boolean; tenant?: PropertyTenant; error?: string }> => {
  try {
    const data = await apiFetch<{ success: boolean; tenant: PropertyTenant }>(
      `/tenants/${encodeURIComponent(tenantId)}`,
      { method: "PATCH", body: input }
    );
    return { success: true, tenant: data.tenant };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Attach existing tenants to a property; returns the updated roster.
 */
export const attachTenantsAction = async (
  propertyIdOrSlug: string,
  tenantIds: string[]
): Promise<{ success: boolean; tenants?: PropertyTenant[]; error?: string }> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      tenants: PropertyTenant[];
    }>(`/properties/${encodeURIComponent(propertyIdOrSlug)}/tenants/attach`, {
      method: "POST",
      body: { tenantIds },
    });
    revalidatePath(`/properties/${propertyIdOrSlug}`);
    return { success: true, tenants: data.tenants };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};

/**
 * Detach a tenant from a property (their record survives in the roster).
 */
export const detachTenantAction = async (
  propertyIdOrSlug: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch<{ success: boolean }>(
      `/properties/${encodeURIComponent(propertyIdOrSlug)}/tenants/${encodeURIComponent(tenantId)}`,
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
 * Permanently delete a tenant from the organization's roster.
 */
export const deleteTenantAction = async (
  tenantId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch<{ success: boolean }>(
      `/tenants/${encodeURIComponent(tenantId)}`,
      { method: "DELETE" }
    );
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: errorMessage(error) };
  }
};
