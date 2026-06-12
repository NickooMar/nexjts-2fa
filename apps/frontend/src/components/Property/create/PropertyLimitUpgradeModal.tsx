"use client";

import { Crown, Lock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { PlanGrid } from "@/components/Billing/PlanGrid";
import {
  usePlans,
  useUsage,
  useSubscription,
} from "@/hooks/queries/use-billing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states/error-state";
import { PropertyLimitErrorDetails } from "@/types/property/property.types";

interface PropertyLimitUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageBilling: boolean;
  limitError: PropertyLimitErrorDetails | null;
  onUpgradeSuccess: () => void;
}

function fallbackPlanName(
  limitError: PropertyLimitErrorDetails | null,
): string {
  return limitError?.currentPlanName ?? limitError?.currentPlan ?? "—";
}

export function PropertyLimitUpgradeModal({
  open,
  onOpenChange,
  canManageBilling,
  limitError,
  onUpgradeSuccess,
}: PropertyLimitUpgradeModalProps) {
  const t = useTranslations("properties.new.upgrade_modal");
  const billing = useTranslations("billing");
  const subscription = useSubscription({ enabled: open });
  const usage = useUsage({ enabled: open });
  const plans = usePlans({ enabled: open });

  const propertyMetric = usage.data?.metrics.find(
    (metric) => metric.limitKey === "properties",
  );
  const currentPlanName =
    subscription.data?.plan.name ?? fallbackPlanName(limitError);
  const limit = propertyMetric?.limit ?? limitError?.limit ?? 0;
  const used = propertyMetric?.used ?? limitError?.current ?? 0;
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[98vh] max-w-7xl overflow-y-auto p-0">
        <div className="border-b bg-muted/30 px-6 py-6 sm:px-8">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              {t("eyebrow")}
            </div>
            <DialogTitle className="text-2xl sm:text-3xl">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="max-w-3xl text-sm sm:text-base">
              {t("description")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-primary/15 bg-primary/5">
              <CardHeader className="space-y-2">
                <CardDescription>{t("usage.current_plan")}</CardDescription>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Crown className="size-5 text-primary" />
                  {currentPlanName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">
                    {t("usage.properties_used")}
                  </span>
                  <span className="text-muted-foreground">
                    {used} / {limit}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-all",
                      ratio >= 1 && "bg-destructive",
                    )}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("usage.summary", { used, limit })}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-muted/20">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">
                  {canManageBilling ? t("cta.title") : t("permissions.title")}
                </CardTitle>
                <CardDescription>
                  {canManageBilling
                    ? t("cta.description")
                    : t("permissions.description")}
                </CardDescription>
              </CardHeader>
              {!canManageBilling && (
                <CardContent className="pt-0">
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Lock className="mt-0.5 size-4 shrink-0" />
                    {t("permissions.help")}
                  </p>
                </CardContent>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            {subscription.isLoading || plans.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-48 rounded-xl" />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Skeleton className="h-[360px] rounded-xl" />
                  <Skeleton className="h-[360px] rounded-xl" />
                  <Skeleton className="h-[360px] rounded-xl" />
                </div>
              </div>
            ) : subscription.isError || !subscription.data ? (
              <ErrorState
                title={t("errors.billing_unavailable_title")}
                description={t("errors.billing_unavailable_description")}
                retryLabel={t("errors.retry")}
                onRetry={() => subscription.refetch()}
                isRetrying={subscription.isRefetching}
              />
            ) : plans.isError || !plans.data ? (
              <ErrorState
                title={t("errors.plans_unavailable_title")}
                description={t("errors.plans_unavailable_description")}
                retryLabel={t("errors.retry")}
                onRetry={() => plans.refetch()}
                isRetrying={plans.isRefetching}
              />
            ) : (
              <PlanGrid
                plans={plans.data}
                overview={subscription.data}
                canManage={canManageBilling}
                mode="upgrade"
                title={billing("plans.title")}
                onPlanChanged={onUpgradeSuccess}
              />
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4 sm:px-8">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
