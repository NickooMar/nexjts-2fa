import z from "zod";
import { PROPERTY_TYPES } from "@/types/property/property.types";

export const propertySchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: t("messages.errors.name_min_length") })
      .max(120, { message: t("messages.errors.name_max_length") }),
    description: z
      .string()
      .trim()
      .max(2000, { message: t("messages.errors.description_max_length") })
      .optional()
      .or(z.literal("")),
    address: z
      .string()
      .trim()
      .min(2, { message: t("messages.errors.address_min_length") })
      .max(200, { message: t("messages.errors.address_max_length") }),
    city: z
      .string()
      .trim()
      .max(120, { message: t("messages.errors.city_max_length") })
      .optional()
      .or(z.literal("")),
    state: z
      .string()
      .trim()
      .max(120, { message: t("messages.errors.state_max_length") })
      .optional()
      .or(z.literal("")),
    country: z
      .string()
      .trim()
      .max(120, { message: t("messages.errors.country_max_length") })
      .optional()
      .or(z.literal("")),
    postalCode: z
      .string()
      .trim()
      .max(20, { message: t("messages.errors.postal_code_max_length") })
      .optional()
      .or(z.literal("")),
    type: z.enum(PROPERTY_TYPES),
    units: z.coerce
      .number()
      .int({ message: t("messages.errors.units_invalid") })
      .min(0, { message: t("messages.errors.units_invalid") })
      .max(100000, { message: t("messages.errors.units_invalid") }),
  });

export type PropertyFormState = z.infer<ReturnType<typeof propertySchema>>;
