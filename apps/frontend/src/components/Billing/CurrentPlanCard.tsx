"use client";

import { useTranslations } from "next-intl";
import { CreditCard, Loader2, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { SubscriptionOverview } from "@/types/billing/billing.types";
import {
  useRetryPayment,
  useResumeSubscription,
} from "@/hooks/mutations/use-billing-mutations";
import {
  formatDate,
  formatMoney,
  planPrice,
  STATUS_BADGE_VARIANT,
} from "./billing.helpers";

interface CurrentPlanCardProps {
  overview: SubscriptionOverview;
  canManage: boolean;
  onCancel: () => void;
}

/**
 * Current plan summary: price, status, period/trial dates, and the
 * subscription-level actions (resume a pending cancellation, retry a failed
 * payment, cancel).
 */
export function CurrentPlanCard({
  overview,
  canManage,
  onCancel,
}: CurrentPlanCardProps) {
  const t = useTranslations("billing");
  const { subscription, plan, entitlements } = overview;
  const price = planPrice(plan, subscription.billingCycle);

  const resume = useResumeSubscription({
    successMessage: t("toasts.resumed"),
    errorMessage: t("toasts.action_failed"),
  });
  const retry = useRetryPayment({
    successMessage: t("toasts.payment_retried"),
    errorMessage: t("toasts.payment_retry_failed"),
  });

  const needsPayment =
    subscription.status === "past_due" || subscription.status === "suspended";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardDescription className="flex items-center gap-2">
            <CreditCard className="size-4" />
            {t("current_plan.title")}
          </CardDescription>
          <CardTitle className="flex flex-wrap items-center gap-3 text-2xl">
            {plan.name}
            <Badge variant={STATUS_BADGE_VARIANT[subscription.status]}>
              {t(`status.${subscription.status}`)}
            </Badge>
            {subscription.cancelAtPeriodEnd && (
              <Badge variant="outline">
                {t("current_plan.cancels_on", {
                  date: formatDate(subscription.currentPeriodEnd),
                })}
              </Badge>
            )}
          </CardTitle>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">
            {price ? formatMoney(price.amount, price.currency) : "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(`cycle.${subscription.billingCycle}`)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">
              {t("current_plan.period_end")}
            </p>
            <p className="font-medium">
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
          {subscription.trialEndsAt && (
            <div>
              <p className="text-muted-foreground">
                {t("current_plan.trial_ends")}
              </p>
              <p className="font-medium">
                {formatDate(subscription.trialEndsAt)}
              </p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">
              {t("current_plan.operational")}
            </p>
            <p className="font-medium">
              {entitlements.isOperational
                ? t("current_plan.operational_yes")
                : t("current_plan.operational_no")}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {needsPayment && (
              <Button
                size="sm"
                onClick={() => retry.mutate()}
                disabled={retry.isPending}
              >
                {retry.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCcw className="size-4" />
                )}
                {t("actions.retry_payment")}
              </Button>
            )}
            {subscription.cancelAtPeriodEnd ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => resume.mutate()}
                disabled={resume.isPending}
              >
                {resume.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t("actions.resume")}
              </Button>
            ) : (
              plan.slug !== "free" && (
                <Button size="sm" variant="outline" onClick={onCancel}>
                  {t("actions.cancel")}
                </Button>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
