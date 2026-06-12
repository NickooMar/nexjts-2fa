"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  fetchCities,
  fetchStates,
  fetchCountries,
} from "@/services/api/locations.api";

/**
 * Geographic reference data for the dependent Country → State → City selectors.
 *
 * The dataset is global and effectively immutable, so every level is cached
 * with an infinite stale/gc time: fetched at most once per session and reused
 * across the create wizard and the edit form. Dependent levels stay disabled
 * until their parent is chosen, and changing the parent (a new query key)
 * refetches automatically — React Query also dedupes concurrent requests.
 */

export function useCountries() {
  return useQuery({
    queryKey: queryKeys.locations.countries(),
    queryFn: fetchCountries,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useStates(countryCode?: string) {
  return useQuery({
    queryKey: queryKeys.locations.states(countryCode ?? ""),
    queryFn: () => fetchStates(countryCode as string),
    enabled: !!countryCode,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useCities(countryCode?: string, stateCode?: string) {
  return useQuery({
    queryKey: queryKeys.locations.cities(countryCode ?? "", stateCode ?? ""),
    queryFn: () => fetchCities(countryCode as string, stateCode as string),
    enabled: !!countryCode && !!stateCode,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
