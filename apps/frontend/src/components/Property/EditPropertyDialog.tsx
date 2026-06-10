"use client";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Property } from "@/types/property/property.types";
import { useUpdateProperty } from "@/hooks/mutations/use-property-mutations";
import { propertySchema, PropertyFormState } from "@/schemas/property.schema";
import { PropertyFormFields } from "./PropertyFormFields";
import { toPropertyInput, toFormValues } from "./property-form.helpers";

interface EditPropertyDialogProps {
  open: boolean;
  property: Property;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (property: Property) => void;
}

export function EditPropertyDialog({
  open,
  property,
  onOpenChange,
  onUpdated,
}: EditPropertyDialogProps) {
  const t = useTranslations("properties");

  const form = useForm<PropertyFormState>({
    resolver: zodResolver(propertySchema(t)),
    defaultValues: toFormValues(property),
  });

  // Re-sync when another property is edited or the server returns fresh data.
  useEffect(() => {
    form.reset(toFormValues(property));
  }, [property, form]);

  // Applies an optimistic cache update (with rollback) and invalidates the
  // property queries; toasts come from the global mutation cache.
  const updateProperty = useUpdateProperty({
    successMessage: t("messages.success.updated"),
    errorMessage: t("messages.errors.update_failed"),
    errorMessages: {
      insufficient_permissions: t(
        "messages.errors.insufficient_permissions"
      ),
    },
    onSuccess: (updated) => {
      onOpenChange(false);
      onUpdated?.(updated);
    },
  });

  const onSubmit = async (values: PropertyFormState) => {
    await updateProperty
      .mutateAsync({
        idOrSlug: property.slug ?? property._id,
        input: toPropertyInput(values),
      })
      .catch(() => {
        // Error toast already shown; keep the dialog open for retry.
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("edit.title")}</DialogTitle>
          <DialogDescription>{t("edit.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PropertyFormFields form={form} />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  t("edit.submit")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
