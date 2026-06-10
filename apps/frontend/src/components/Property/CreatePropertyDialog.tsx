"use client";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Property } from "@/types/property/property.types";
import { useCreateProperty } from "@/hooks/mutations/use-property-mutations";
import { propertySchema, PropertyFormState } from "@/schemas/property.schema";
import { PropertyFormFields } from "./PropertyFormFields";
import { toPropertyInput } from "./property-form.helpers";

interface CreatePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (property: Property) => void;
}

export function CreatePropertyDialog({
  open,
  onOpenChange,
  onCreated,
}: CreatePropertyDialogProps) {
  const t = useTranslations("properties");

  const form = useForm<PropertyFormState>({
    resolver: zodResolver(propertySchema(t)),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      type: "apartment",
      units: 1,
    },
  });

  // Cache invalidation and toasts are handled by the mutation hook / global
  // mutation cache; this component only manages the form and dialog state.
  const createProperty = useCreateProperty({
    successMessage: t("messages.success.created"),
    errorMessage: t("messages.errors.create_failed"),
    errorMessages: {
      insufficient_permissions: t(
        "messages.errors.insufficient_permissions"
      ),
    },
    onSuccess: (property) => {
      form.reset();
      onOpenChange(false);
      onCreated?.(property);
    },
  });

  const onSubmit = async (values: PropertyFormState) => {
    await createProperty.mutateAsync(toPropertyInput(values)).catch(() => {
      // Error toast already shown by the global mutation cache; swallowing
      // here just keeps the dialog open for another attempt.
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("create.title")}</DialogTitle>
          <DialogDescription>{t("create.description")}</DialogDescription>
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
                  t("create.submit")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
