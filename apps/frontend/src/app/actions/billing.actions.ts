"use server";

import { apiFetch } from "@/lib/api";
import {
  Plan,
  Usage,
  Invoice,
  Payment,
  BillingCycle,
  SubscriptionOverview,
} from "@/types/billing/billing.types";

/**
 * Server actions for organization billing. Like every other action they
 * return `{ success, error }` envelopes (Next.js redacts thrown errors); the
 * service layer converts failures into ApiErrors for React Query.
 *
 * The active organization comes from the session token server-side — the
 * client never passes an organization id.
 */

type Envelope<T> = { success: boolean; error?: string } & T;

const fail = (error: unknown) =>
  error instanceof Error ? error.message : "unknown_error";

export const listPlansAction = async (): Promise<
  Envelope<{ plans: Plan[] }>
> => {
  try {
    const data = await apiFetch<{ success: boolean; plans: Plan[] }>(
      "/billing/plans"
    );
    return { success: true, plans: data.plans ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, plans: [], error: fail(error) };
  }
};

export const getSubscriptionAction = async (): Promise<
  Envelope<{ overview?: SubscriptionOverview }>
> => {
  try {
    const data = await apiFetch<{ success: boolean } & SubscriptionOverview>(
      "/billing/subscription"
    );
    return {
      success: true,
      overview: {
        subscription: data.subscription,
        plan: data.plan,
        entitlements: data.entitlements,
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: fail(error) };
  }
};

export const getUsageAction = async (): Promise<
  Envelope<{ usage?: Usage }>
> => {
  try {
    const data = await apiFetch<{ success: boolean; usage: Usage }>(
      "/billing/usage"
    );
    return { success: true, usage: data.usage };
  } catch (error) {
    console.error(error);
    return { success: false, error: fail(error) };
  }
};

export const listInvoicesAction = async (): Promise<
  Envelope<{ invoices: Invoice[] }>
> => {
  try {
    const data = await apiFetch<{ success: boolean; invoices: Invoice[] }>(
      "/billing/invoices"
    );
    return { success: true, invoices: data.invoices ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, invoices: [], error: fail(error) };
  }
};

export const listPaymentsAction = async (): Promise<
  Envelope<{ payments: Payment[] }>
> => {
  try {
    const data = await apiFetch<{ success: boolean; payments: Payment[] }>(
      "/billing/payments"
    );
    return { success: true, payments: data.payments ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, payments: [], error: fail(error) };
  }
};

export const checkoutAction = async (
  planSlug: string,
  billingCycle: BillingCycle
): Promise<Envelope<{ checkoutUrl?: string }>> => {
  try {
    const data = await apiFetch<{ success: boolean; checkoutUrl?: string }>(
      "/billing/checkout",
      { method: "POST", body: { planSlug, billingCycle } }
    );
    return { success: data.success, checkoutUrl: data.checkoutUrl };
  } catch (error) {
    console.error(error);
    return { success: false, error: fail(error) };
  }
};

export const changePlanAction = async (
  planSlug: string,
  billingCycle: BillingCycle
): Promise<Envelope<object>> => {
  try {
    const data = await apiFetch<{ success: boolean }>("/billing/change-plan", {
      method: "POST",
      body: { planSlug, billingCycle },
    });
    return { success: data.success };
  } catch (error) {
    console.error(error);
    return { success: false, error: fail(error) };
  }
};

export const cancelSubscriptionAction = async (): Promise<Envelope<object>> => {
  try {
    const data = await apiFetch<{ success: boolean }>("/billing/cancel", {
      method: "POST",
    });
    return { success: data.success };
  } catch (error) {
    console.error(error);
    return { success: false, error: fail(error) };
  }
};

export const resumeSubscriptionAction = async (): Promise<Envelope<object>> => {
  try {
    const data = await apiFetch<{ success: boolean }>("/billing/resume", {
      method: "POST",
    });
    return { success: data.success };
  } catch (error) {
    console.error(error);
    return { success: false, error: fail(error) };
  }
};

export const retryPaymentAction = async (): Promise<Envelope<object>> => {
  try {
    const data = await apiFetch<{ success: boolean }>(
      "/billing/retry-payment",
      { method: "POST" }
    );
    return { success: data.success };
  } catch (error) {
    console.error(error);
    return { success: false, error: fail(error) };
  }
};
