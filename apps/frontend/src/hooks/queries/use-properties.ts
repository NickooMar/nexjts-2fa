"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { fetchProperties, fetchProperty } from "@/services/api/properties.api";
import { Property } from "@/types/property/property.types";

/**
 * Current tenant's properties. Pages that prefetch on the server pass the
 * result as `initialData` so the first render is instant and React Query
 * takes over refreshing from there.
 */
export function useProperties(options?: { initialData?: Property[] }) {
  return useQuery({
    queryKey: queryKeys.properties.list(),
    queryFn: fetchProperties,
    initialData: options?.initialData,
  });
}

/** Single property by Mongo id, public uuid, or slug. */
export function useProperty(
  idOrSlug: string,
  options?: { initialData?: Property; enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.properties.detail(idOrSlug),
    queryFn: () => fetchProperty(idOrSlug),
    initialData: options?.initialData,
    enabled: options?.enabled ?? Boolean(idOrSlug),
  });
}
