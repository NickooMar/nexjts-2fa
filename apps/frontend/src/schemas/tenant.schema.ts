import z from "zod";

/** Property tenant (renter) — see types/property/tenant.types.ts. */
export const tenantSchema = (t: (key: string) => string) =>
  z.object({
    fullName: z
      .string()
      .trim()
      .min(2, { message: t("messages.errors.tenant_name_min_length") })
      .max(160, { message: t("messages.errors.tenant_name_max_length") }),
    email: z
      .string()
      .trim()
      .email({ message: t("messages.errors.tenant_email_invalid") })
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .max(30, { message: t("messages.errors.tenant_phone_max_length") })
      .optional()
      .or(z.literal("")),
    documentId: z
      .string()
      .trim()
      .max(60, { message: t("messages.errors.tenant_document_max_length") })
      .optional()
      .or(z.literal("")),
    notes: z
      .string()
      .trim()
      .max(1000, { message: t("messages.errors.tenant_notes_max_length") })
      .optional()
      .or(z.literal("")),
  });

export type TenantFormState = z.infer<ReturnType<typeof tenantSchema>>;
