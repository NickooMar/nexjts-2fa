"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  fetchPlans,
  fetchUsage,
  fetchInvoices,
  fetchPayments,
  fetchSubscription,
} from "@/services/api/billing.api";

/** Public plan catalog — changes rarely, cache aggressively. */
export function usePlans(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.billing.plans(),
    queryFn: fetchPlans,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

/** Current org's subscription + plan + entitlements. */
export function useSubscription(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.billing.subscription(),
    queryFn: fetchSubscription,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Entitlements for feature-gating UI (`entitlements.features.crm`, …).
 * Reads from the same subscription query so gating and the billing page
 * share one cache entry.
 */
export function useEntitlements() {
  const subscription = useSubscription();
  return {
    ...subscription,
    entitlements: subscription.data?.entitlements,
    hasFeature: (key: string) =>
      subscription.data?.entitlements?.features?.[key] === true,
  };
}

/** Usage meters (server reconciles authoritative gauges on each read). */
export function useUsage(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.billing.usage(),
    queryFn: fetchUsage,
    enabled: options?.enabled ?? true,
  });
}

export function useInvoices(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.billing.invoices(),
    queryFn: fetchInvoices,
    enabled: options?.enabled ?? true,
  });
}

export function usePayments(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.billing.payments(),
    queryFn: fetchPayments,
    enabled: options?.enabled ?? true,
  });
}
