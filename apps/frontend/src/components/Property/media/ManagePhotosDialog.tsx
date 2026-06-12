"use client";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { Property } from "@/types/property/property.types";
import { PropertyPhotosManager } from "./PropertyPhotosManager";

interface ManagePhotosDialogProps {
  open: boolean;
  property: Property;
  onOpenChange: (open: boolean) => void;
}

export function ManagePhotosDialog({
  open,
  property,
  onOpenChange,
}: ManagePhotosDialogProps) {
  const t = useTranslations("properties.media");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("manage_title")}</DialogTitle>
          <DialogDescription>{t("manage_description")}</DialogDescription>
        </DialogHeader>
        <PropertyPhotosManager property={property} />
      </DialogContent>
    </Dialog>
  );
}
