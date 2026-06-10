"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  fetchMembers,
  fetchOrganizations,
} from "@/services/api/organizations.api";

/**
 * Organizations the current user belongs to (org switcher). Pass `enabled`
 * to defer fetching until the UI actually needs the list (e.g. dropdown open).
 */
export function useOrganizations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: fetchOrganizations,
    enabled: options?.enabled ?? true,
  });
}

/** Members of the caller's current organization. */
export function useOrganizationMembers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.memberships.list(),
    queryFn: fetchMembers,
    enabled: options?.enabled ?? true,
  });
}
