import z from "zod";

/**
 * Property contact (renter/owner) form schema. `t` is a translator already
 * scoped to the role's namespace (`properties.tenants` or `properties.owners`),
 * so the same generic error keys resolve to role-specific copy.
 */
export const contactSchema = (t: (key: string) => string) =>
  z.object({
    fullName: z
      .string()
      .trim()
      .min(2, { message: t("messages.errors.name_min_length") })
      .max(160, { message: t("messages.errors.name_max_length") }),
    email: z
      .string()
      .trim()
      .email({ message: t("messages.errors.email_invalid") })
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .max(30, { message: t("messages.errors.phone_max_length") })
      .optional()
      .or(z.literal("")),
    documentId: z
      .string()
      .trim()
      .max(60, { message: t("messages.errors.document_max_length") })
      .optional()
      .or(z.literal("")),
    notes: z
      .string()
      .trim()
      .max(1000, { message: t("messages.errors.notes_max_length") })
      .optional()
      .or(z.literal("")),
  });

export type ContactFormState = z.infer<ReturnType<typeof contactSchema>>;
