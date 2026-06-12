/**
 * Client-side service layer for billing. Unwraps the `{ success, error }`
 * envelopes returned by server actions into thrown ApiErrors so React Query
 * drives retries and error states (same contract as organizations.api).
 */

import {
  checkoutAction,
  getUsageAction,
  listPlansAction,
  changePlanAction,
  listInvoicesAction,
  listPaymentsAction,
  retryPaymentAction,
  getSubscriptionAction,
  cancelSubscriptionAction,
  resumeSubscriptionAction,
} from "@/app/actions/billing.actions";
import { ApiError } from "@/lib/react-query/types";
import {
  Plan,
  Usage,
  Invoice,
  Payment,
  BillingCycle,
  SubscriptionOverview,
} from "@/types/billing/billing.types";

export async function fetchPlans(): Promise<Plan[]> {
  const result = await listPlansAction();
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.plans;
}

export async function fetchSubscription(): Promise<SubscriptionOverview> {
  const result = await getSubscriptionAction();
  if (!result.success || !result.overview) {
    throw new ApiError(result.error ?? "unknown_error");
  }
  return result.overview;
}

export async function fetchUsage(): Promise<Usage> {
  const result = await getUsageAction();
  if (!result.success || !result.usage) {
    throw new ApiError(result.error ?? "unknown_error");
  }
  return result.usage;
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const result = await listInvoicesAction();
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.invoices;
}

export async function fetchPayments(): Promise<Payment[]> {
  const result = await listPaymentsAction();
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.payments;
}

export async function checkout(input: {
  planSlug: string;
  billingCycle: BillingCycle;
}): Promise<{ checkoutUrl?: string }> {
  const result = await checkoutAction(input.planSlug, input.billingCycle);
  if (!result.success) throw new ApiError(result.error ?? "checkout_failed");
  return { checkoutUrl: result.checkoutUrl };
}

export async function changePlan(input: {
  planSlug: string;
  billingCycle: BillingCycle;
}): Promise<void> {
  const result = await changePlanAction(input.planSlug, input.billingCycle);
  if (!result.success) throw new ApiError(result.error ?? "change_failed");
}

export async function cancelSubscription(): Promise<void> {
  const result = await cancelSubscriptionAction();
  if (!result.success) throw new ApiError(result.error ?? "cancel_failed");
}

export async function resumeSubscription(): Promise<void> {
  const result = await resumeSubscriptionAction();
  if (!result.success) throw new ApiError(result.error ?? "resume_failed");
}

export async function retryPayment(): Promise<void> {
  const result = await retryPaymentAction();
  if (!result.success) throw new ApiError(result.error ?? "retry_failed");
}
