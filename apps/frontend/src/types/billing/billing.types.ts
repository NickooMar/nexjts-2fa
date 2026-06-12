/** Mirrors the billing service's public payloads (gateway /billing/*). */

export type BillingCycle = "monthly" | "yearly";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled"
  | "expired";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "void"
  | "uncollectible";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface PlanPrice {
  /** Minor units (cents). */
  amount: number;
  currency: string;
}

export interface Plan {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  prices: Partial<Record<BillingCycle, PlanPrice>>;
  /** Open map; -1 = unlimited. */
  limits: Record<string, number>;
  features: Record<string, boolean>;
  trialDays: number;
  sortOrder: number;
}

export interface Subscription {
  _id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string | null;
}

/** Plan limits/features merged with org-level overrides + live status. */
export interface Entitlements {
  organizationId: string;
  planId: string;
  planSlug: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  isOperational: boolean;
  limits: Record<string, number>;
  features: Record<string, boolean>;
  currentPeriodEnd: string;
  trialEndsAt?: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionOverview {
  subscription: Subscription;
  plan: Plan;
  entitlements: Entitlements;
  /** Hosted checkout redirect (absent for synchronous providers). */
  checkoutUrl?: string;
}

export interface UsageMetric {
  limitKey: string;
  /** Bytes for storageGb; plain counts otherwise. */
  used: number;
  limit: number | null;
  unlimited: boolean;
  /** True for monthly meters (reset each period). */
  monthly: boolean;
  remaining: number | null;
}

export interface Usage {
  organizationId: string;
  period: string;
  metrics: UsageMetric[];
  syncedAt: string | null;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  number: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface Payment {
  _id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  attempt: number;
  failureReason?: string | null;
  createdAt: string;
}
