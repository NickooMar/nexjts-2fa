import {
  BillingCycle,
  Plan,
  SubscriptionStatus,
} from "@/types/billing/billing.types";

/** Amounts arrive in minor units (cents). */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const STATUS_BADGE_VARIANT: Record<
  SubscriptionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  trialing: "secondary",
  past_due: "destructive",
  suspended: "destructive",
  cancelled: "outline",
  expired: "outline",
};

export function planPrice(plan: Plan, cycle: BillingCycle) {
  return plan.prices?.[cycle] ?? plan.prices?.monthly ?? null;
}

/** Ranks plans by monthly price for the upgrade/downgrade copy. */
export function isUpgrade(current: Plan | undefined, target: Plan): boolean {
  if (!current) return true;
  const currentAmount = current.prices?.monthly?.amount ?? 0;
  const targetAmount = target.prices?.monthly?.amount ?? 0;
  return targetAmount > currentAmount;
}

/** Storage usage is metered in bytes but configured in GB. */
export const GB = 1024 * 1024 * 1024;
