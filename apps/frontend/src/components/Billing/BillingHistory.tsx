"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { useInvoices, usePayments } from "@/hooks/queries/use-billing";
import {
  Invoice,
  Payment,
  InvoiceStatus,
  PaymentStatus,
} from "@/types/billing/billing.types";
import { formatDate, formatMoney } from "./billing.helpers";

const INVOICE_BADGE: Record<
  InvoiceStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  paid: "default",
  open: "destructive",
  draft: "secondary",
  void: "outline",
  uncollectible: "destructive",
};

const PAYMENT_BADGE: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  succeeded: "default",
  pending: "secondary",
  failed: "destructive",
  refunded: "outline",
};

/** Invoices and payment attempts, in two lazily-fetched tabs. */
export function BillingHistory() {
  const t = useTranslations("billing");
  const [tab, setTab] = useState<"invoices" | "payments">("invoices");

  const invoices = useInvoices({ enabled: tab === "invoices" });
  const payments = usePayments({ enabled: tab === "payments" });

  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Receipt className="size-4" />
          {t("history.title")}
        </CardDescription>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t("history.subtitle")}</CardTitle>
          <div className="flex items-center rounded-lg border border-border p-0.5">
            {(["invoices", "payments"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTab(option)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm transition-colors",
                  tab === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(`history.${option}`)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tab === "invoices" ? (
          <HistoryList
            isLoading={invoices.isLoading}
            isEmpty={(invoices.data ?? []).length === 0}
            emptyLabel={t("history.no_invoices")}
          >
            {(invoices.data ?? []).map((invoice: Invoice) => (
              <li
                key={invoice._id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-medium">{invoice.number}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(invoice.periodStart)} –{" "}
                    {formatDate(invoice.periodEnd)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={INVOICE_BADGE[invoice.status]}>
                    {t(`invoice_status.${invoice.status}`)}
                  </Badge>
                  <span className="font-medium">
                    {formatMoney(invoice.total, invoice.currency)}
                  </span>
                </div>
              </li>
            ))}
          </HistoryList>
        ) : (
          <HistoryList
            isLoading={payments.isLoading}
            isEmpty={(payments.data ?? []).length === 0}
            emptyLabel={t("history.no_payments")}
          >
            {(payments.data ?? []).map((payment: Payment) => (
              <li
                key={payment._id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-medium">
                    {formatDate(payment.createdAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("history.attempt", { number: payment.attempt })}
                    {payment.failureReason && ` · ${payment.failureReason}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={PAYMENT_BADGE[payment.status]}>
                    {t(`payment_status.${payment.status}`)}
                  </Badge>
                  <span className="font-medium">
                    {formatMoney(payment.amount, payment.currency)}
                  </span>
                </div>
              </li>
            ))}
          </HistoryList>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryList({
  isLoading,
  isEmpty,
  emptyLabel,
  children,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  return <ul className="divide-y divide-border">{children}</ul>;
}
