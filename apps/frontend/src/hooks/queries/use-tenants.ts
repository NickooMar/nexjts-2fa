"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  fetchTenants,
  fetchPropertyTenants,
} from "@/services/api/tenants.api";
import { PropertyTenant } from "@/types/property/tenant.types";

/** The organization's whole property-tenant roster (for pickers). */
export function useTenants(options?: {
  initialData?: PropertyTenant[];
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.tenants.list(),
    queryFn: fetchTenants,
    initialData: options?.initialData,
    enabled: options?.enabled ?? true,
  });
}

/** Tenants currently attached to one property. */
export function usePropertyTenants(
  propertyIdOrSlug: string,
  options?: { initialData?: PropertyTenant[]; enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.tenants.byProperty(propertyIdOrSlug),
    queryFn: () => fetchPropertyTenants(propertyIdOrSlug),
    initialData: options?.initialData,
    enabled: options?.enabled ?? Boolean(propertyIdOrSlug),
  });
}
