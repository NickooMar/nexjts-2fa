"use client";

import { useTranslations } from "next-intl";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Usage, UsageMetric } from "@/types/billing/billing.types";
import { formatBytes, GB } from "./billing.helpers";

interface UsageMetersProps {
  usage: Usage;
}

/** Meters shown on the dashboard (the rest exist but are secondary). */
const PRIMARY_METRICS = [
  "properties",
  "storageGb",
  "members",
  "fileUploadsPerMonth",
  "apiRequestsPerMonth",
  "activeListings",
];

function metricValues(metric: UsageMetric): {
  usedLabel: string;
  limitLabel: string | null;
  ratio: number | null;
} {
  const isStorage = metric.limitKey === "storageGb";
  const usedLabel = isStorage
    ? formatBytes(metric.used)
    : String(metric.used);

  if (metric.unlimited || metric.limit === null) {
    return { usedLabel, limitLabel: null, ratio: null };
  }
  const limitAbsolute = isStorage ? metric.limit * GB : metric.limit;
  return {
    usedLabel,
    limitLabel: isStorage ? formatBytes(limitAbsolute) : String(metric.limit),
    ratio: limitAbsolute > 0 ? Math.min(metric.used / limitAbsolute, 1) : 1,
  };
}

/**
 * Usage vs plan limits, as progress meters. The bar turns amber at 80% and
 * red at 100% so an approaching limit is visible before writes get rejected.
 */
export function UsageMeters({ usage }: UsageMetersProps) {
  const t = useTranslations("billing");

  const metrics = PRIMARY_METRICS.map((key) =>
    usage.metrics.find((metric) => metric.limitKey === key)
  ).filter((metric): metric is UsageMetric => metric !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Gauge className="size-4" />
          {t("usage.title")}
        </CardDescription>
        <CardTitle className="text-lg">
          {t("usage.subtitle", { period: usage.period })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {metrics.map((metric) => {
            const { usedLabel, limitLabel, ratio } = metricValues(metric);
            return (
              <div key={metric.limitKey} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">
                    {t(`limits.${metric.limitKey}`)}
                    {metric.monthly && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {t("usage.per_month")}
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {limitLabel
                      ? `${usedLabel} / ${limitLabel}`
                      : `${usedLabel} · ${t("usage.unlimited")}`}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-all",
                      ratio !== null && ratio >= 0.8 && "bg-amber-500",
                      ratio !== null && ratio >= 1 && "bg-destructive"
                    )}
                    style={{
                      width: ratio === null ? "100%" : `${ratio * 100}%`,
                      opacity: ratio === null ? 0.15 : 1,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
