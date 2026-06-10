"use client";

import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Globe, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelect } from "@/components/ui/country-select";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateOrganization } from "@/hooks/mutations/use-organization-mutations";
import {
  createOrganizationSchema,
  CreateOrganizationFormState,
} from "@/schemas/organization.schema";

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const t = useTranslations("auth");

  const form = useForm<CreateOrganizationFormState>({
    resolver: zodResolver(createOrganizationSchema(t)),
    defaultValues: { name: "", website: "", phone: "", country: "" },
  });

  // On success the hook refreshes the NextAuth session, clears the (now
  // wrong-tenant) query cache, and refreshes server components.
  const createOrganization = useCreateOrganization({
    successMessage: "Organization created",
    errorMessage: "Could not create the organization",
    onSuccess: () => {
      form.reset();
      onOpenChange(false);
    },
  });

  const onSubmit = async (values: CreateOrganizationFormState) => {
    await createOrganization.mutateAsync(values).catch(() => {
      // Error toast already shown; keep the dialog open for retry.
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("create_organization.title")}</DialogTitle>
          <DialogDescription>
            {t("create_organization.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("signup.organization.title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      autoFocus
                      placeholder={t("signup.organization.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("create_organization.website.title")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="url"
                        className="pl-9"
                        placeholder={t(
                          "create_organization.website.placeholder",
                        )}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("create_organization.country.title")}
                  </FormLabel>
                  <FormControl>
                    <CountrySelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("create_organization.country.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create_organization.phone.title")}</FormLabel>
                  <FormControl>
                    <PhoneInput
                      {...field}
                      defaultCountry="AR"
                      placeholder={t("create_organization.phone.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  t("create_organization.submit")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
