"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
  CardFooter,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plan,
  BillingCycle,
  SubscriptionOverview,
} from "@/types/billing/billing.types";
import {
  useCheckout,
  useChangePlan,
} from "@/hooks/mutations/use-billing-mutations";
import { formatMoney, isUpgrade, planPrice } from "./billing.helpers";

interface PlanGridProps {
  plans: Plan[];
  overview: SubscriptionOverview;
  canManage: boolean;
  mode?: "catalog" | "upgrade";
  title?: string;
  onPlanChanged?: () => void;
}

/** Feature keys rendered on each plan card, in display order. */
const FEATURE_KEYS = [
  "crm",
  "analytics",
  "aiDescriptions",
  "whatsappIntegration",
  "customBranding",
  "apiAccess",
  "prioritySupport",
];

/** Limits highlighted on each plan card. */
const LIMIT_KEYS = ["properties", "members", "storageGb"];

/**
 * Plan catalog with a monthly/yearly toggle and the upgrade/downgrade flow.
 * Confirmation happens in a dialog; the backend re-validates everything
 * (role, usage-vs-limits on downgrades, payment) — this UI is a convenience.
 */
export function PlanGrid({
  plans,
  overview,
  canManage,
  mode = "catalog",
  title,
  onPlanChanged,
}: PlanGridProps) {
  const t = useTranslations("billing");
  const [cycle, setCycle] = useState<BillingCycle>(
    overview.subscription.billingCycle,
  );
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);

  const isCurrent = (plan: Plan) =>
    plan.slug === overview.plan.slug &&
    cycle === overview.subscription.billingCycle;

  const checkout = useCheckout({
    successMessage: t("toasts.plan_changed"),
    errorMessage: t("errors.plan_change_failed"),
    errorMessages: {
      payment_failed: t("errors.payment_failed"),
      already_subscribed: t("errors.already_subscribed"),
    },
    onSuccess: () => {
      setPendingPlan(null);
      onPlanChanged?.();
    },
  });
  const changePlan = useChangePlan({
    successMessage: t("toasts.plan_changed"),
    errorMessage: t("errors.plan_change_failed"),
    errorMessages: {
      downgrade_exceeds_limits: t("errors.downgrade_exceeds_limits"),
      payment_failed: t("errors.payment_failed"),
    },
    onSuccess: () => {
      setPendingPlan(null);
      onPlanChanged?.();
    },
  });

  const confirmChange = () => {
    if (!pendingPlan) return;
    const input = { planSlug: pendingPlan.slug, billingCycle: cycle };
    // First purchase from the free plan goes through checkout (may redirect
    // to a hosted page); switching between paid plans charges directly.
    if (overview.plan.slug === "free") {
      checkout.mutate(input);
    } else {
      changePlan.mutate(input);
    }
  };

  const isMutating = checkout.isPending || changePlan.isPending;
  const visiblePlans =
    mode === "upgrade"
      ? plans.filter(
          (plan) =>
            plan.slug === overview.plan.slug || isUpgrade(overview.plan, plan),
        )
      : plans;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title ?? t("plans.title")}</h2>
        <div className="flex items-center rounded-lg border border-border p-0.5">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCycle(option)}
              className={cn(
                "rounded-md px-3 py-1 text-sm transition-colors",
                cycle === option
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`cycle.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visiblePlans.map((plan) => {
          const price = planPrice(plan, cycle);
          const current = isCurrent(plan);
          const upgrade = isUpgrade(overview.plan, plan);

          return (
            <Card
              key={plan.slug}
              className={cn(
                "flex flex-col",
                current && "border-primary ring-1 ring-primary",
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {plan.name}
                  {current && (
                    <Badge variant="secondary">{t("plans.current")}</Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <p className="pt-2 text-3xl font-semibold">
                  {price ? formatMoney(price.amount, price.currency) : "—"}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {t(`cycle_short.${cycle}`)}
                  </span>
                </p>
                {plan.trialDays > 0 && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5" />
                    {t("plans.trial", { days: plan.trialDays })}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1 space-y-1.5 text-sm">
                {LIMIT_KEYS.map((key) => {
                  const limit = plan.limits?.[key];
                  return (
                    <p key={key} className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {limit === -1 ? t("usage.unlimited") : (limit ?? "—")}
                      </span>{" "}
                      {t(`limits.${key}`)}
                    </p>
                  );
                })}
                <div className="space-y-1.5 pt-3">
                  {FEATURE_KEYS.map((key) => {
                    const enabled = plan.features?.[key] === true;
                    return (
                      <p
                        key={key}
                        className={cn(
                          "flex items-center gap-2",
                          !enabled && "text-muted-foreground/60",
                        )}
                      >
                        {enabled ? (
                          <Check className="size-4 text-primary" />
                        ) : (
                          <Minus className="size-4" />
                        )}
                        {t(`features.${key}`)}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
              {canManage && (
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={upgrade ? "default" : "outline"}
                    disabled={current}
                    onClick={() => setPendingPlan(plan)}
                  >
                    {current
                      ? t("plans.current")
                      : upgrade
                        ? t("actions.upgrade")
                        : t("actions.downgrade")}
                  </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog
        open={pendingPlan !== null}
        onOpenChange={(open) => !open && setPendingPlan(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingPlan && isUpgrade(overview.plan, pendingPlan)
                ? t("confirm.upgrade_title", { plan: pendingPlan?.name ?? "" })
                : t("confirm.downgrade_title", {
                    plan: pendingPlan?.name ?? "",
                  })}
            </DialogTitle>
            <DialogDescription>
              {pendingPlan &&
                t("confirm.description", {
                  plan: pendingPlan.name,
                  price: (() => {
                    const price = planPrice(pendingPlan, cycle);
                    return price
                      ? formatMoney(price.amount, price.currency)
                      : "—";
                  })(),
                  cycle: t(`cycle.${cycle}`),
                })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingPlan(null)}
              disabled={isMutating}
            >
              {t("confirm.back")}
            </Button>
            <Button onClick={confirmChange} disabled={isMutating}>
              {isMutating && <Loader2 className="size-4 animate-spin" />}
              {t("confirm.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
