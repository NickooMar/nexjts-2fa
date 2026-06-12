"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCancelSubscription } from "@/hooks/mutations/use-billing-mutations";
import { formatDate } from "./billing.helpers";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodEnd: string;
}

/**
 * Cancellation keeps service until the period end, then the organization
 * falls back to the free plan — the copy makes both facts explicit.
 */
export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  periodEnd,
}: CancelSubscriptionDialogProps) {
  const t = useTranslations("billing");

  const cancel = useCancelSubscription({
    successMessage: t("toasts.cancelled"),
    errorMessage: t("toasts.action_failed"),
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cancel_dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("cancel_dialog.description", { date: formatDate(periodEnd) })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancel.isPending}
          >
            {t("cancel_dialog.keep")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
          >
            {cancel.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("cancel_dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
