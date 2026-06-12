"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states/error-state";
import { PlanGrid } from "@/components/Billing/PlanGrid";
import { UsageMeters } from "@/components/Billing/UsageMeters";
import { BillingHistory } from "@/components/Billing/BillingHistory";
import { CurrentPlanCard } from "@/components/Billing/CurrentPlanCard";
import { CancelSubscriptionDialog } from "@/components/Billing/CancelSubscriptionDialog";
import { usePlans, useSubscription, useUsage } from "@/hooks/queries/use-billing";

interface BillingClientProps {
  organizationName?: string;
  /** Whether the viewer can mutate the subscription (owner). */
  canManage: boolean;
}

/**
 * Organization billing dashboard: current plan & status, usage vs limits,
 * the plan catalog (upgrade/downgrade/checkout) and invoice/payment history.
 * All data is scoped server-side to the active organization.
 */
export default function BillingClient({
  organizationName,
  canManage,
}: BillingClientProps) {
  const t = useTranslations("billing");
  const [cancelOpen, setCancelOpen] = useState(false);

  const subscription = useSubscription();
  const usage = useUsage();
  const plans = usePlans();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("page.title")}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {organizationName
            ? t("page.description_org", { organization: organizationName })
            : t("page.description")}
        </p>
      </header>

      {subscription.isLoading ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : subscription.isError || !subscription.data ? (
        <ErrorState
          title={t("page.error_title")}
          description={t("page.error_description")}
          retryLabel={t("page.retry")}
          onRetry={() => subscription.refetch()}
          isRetrying={subscription.isRefetching}
        />
      ) : (
        <>
          <CurrentPlanCard
            overview={subscription.data}
            canManage={canManage}
            onCancel={() => setCancelOpen(true)}
          />

          {usage.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            usage.data && <UsageMeters usage={usage.data} />
          )}

          {plans.data && plans.data.length > 0 && (
            <PlanGrid
              plans={plans.data}
              overview={subscription.data}
              canManage={canManage}
            />
          )}

          <BillingHistory />

          <CancelSubscriptionDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            periodEnd={subscription.data.subscription.currentPeriodEnd}
          />
        </>
      )}
    </div>
  );
}
