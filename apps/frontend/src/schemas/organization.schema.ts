import z from "zod";

export const createOrganizationSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(2, { message: t("messages.errors.organization_name_min_length") })
      .max(60, { message: t("messages.errors.organization_name_max_length") }),
    website: z
      .union([
        z.string().url({ message: t("messages.errors.organization_website_invalid") }),
        z.literal(""),
      ])
      .optional(),
    phone: z
      .string()
      .max(30, { message: t("messages.errors.organization_phone_max_length") })
      .optional(),
    country: z
      .string()
      .min(1, { message: t("messages.errors.organization_country_required") })
      .max(60, { message: t("messages.errors.organization_country_max_length") }),
  });

export const joinOrganizationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, { message: "Invitation code is too short" })
    .max(16, { message: "Invitation code is too long" }),
});

export type CreateOrganizationFormState = z.infer<
  ReturnType<typeof createOrganizationSchema>
>;
export type JoinOrganizationFormState = z.infer<typeof joinOrganizationSchema>;
