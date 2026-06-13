"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { fetchOwners, fetchPropertyOwners } from "@/services/api/owners.api";
import { PropertyOwner } from "@/types/property/owner.types";

/** The organization's whole property-owner roster (for pickers). */
export function useOwners(options?: {
  initialData?: PropertyOwner[];
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.owners.list(),
    queryFn: fetchOwners,
    initialData: options?.initialData,
    enabled: options?.enabled ?? true,
  });
}

/** Owners currently attached to one property. */
export function usePropertyOwners(
  propertyIdOrSlug: string,
  options?: { initialData?: PropertyOwner[]; enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.owners.byProperty(propertyIdOrSlug),
    queryFn: () => fetchPropertyOwners(propertyIdOrSlug),
    initialData: options?.initialData,
    enabled: options?.enabled ?? Boolean(propertyIdOrSlug),
  });
}
