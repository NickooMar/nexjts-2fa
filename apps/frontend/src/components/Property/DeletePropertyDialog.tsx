"use client";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Property } from "@/types/property/property.types";
import { useDeleteProperty } from "@/hooks/mutations/use-property-mutations";

interface DeletePropertyDialogProps {
  open: boolean;
  property: Property;
  onOpenChange: (open: boolean) => void;
  onDeleted?: (property: Property) => void;
}

export function DeletePropertyDialog({
  open,
  property,
  onOpenChange,
  onDeleted,
}: DeletePropertyDialogProps) {
  const t = useTranslations("properties");

  // Removes the property from the cached list optimistically (with rollback);
  // toasts come from the global mutation cache.
  const deleteProperty = useDeleteProperty({
    successMessage: t("messages.success.deleted"),
    errorMessage: t("messages.errors.delete_failed"),
    errorMessages: {
      insufficient_permissions: t(
        "messages.errors.insufficient_permissions"
      ),
    },
    onSuccess: () => {
      onOpenChange(false);
      onDeleted?.(property);
    },
  });
  const isDeleting = deleteProperty.isPending;

  const onConfirm = () => {
    deleteProperty.mutate(property.slug ?? property._id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-destructive" />
            {t("delete.title")}
          </DialogTitle>
          <DialogDescription>
            {t("delete.description", { name: property.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            {t("delete.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? (
              <Loader className="size-4 animate-spin" />
            ) : (
              t("delete.confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
