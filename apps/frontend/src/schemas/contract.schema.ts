import z from "zod";
import {
  CONTRACT_TYPES,
  CONTRACT_STATUSES,
  PAYMENT_FREQUENCIES,
} from "@/types/property/contract.types";

/**
 * Optional money input, kept as a string so the controlled <input> never
 * flips to undefined; converted to a number (or dropped) on submission.
 * Plain `z.coerce.number()` would turn "" into 0 and silently submit an
 * amount the user never typed.
 */
const optionalAmount = (message: string) =>
  z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || (Number.isFinite(Number(value)) && Number(value) >= 0),
      { message }
    );

export const contractSchema = (t: (key: string) => string) =>
  z
    .object({
      title: z
        .string()
        .trim()
        .min(2, { message: t("messages.errors.contract_title_min_length") })
        .max(160, { message: t("messages.errors.contract_title_max_length") }),
      type: z.enum(CONTRACT_TYPES),
      status: z.enum(CONTRACT_STATUSES),
      startDate: z.string().optional().or(z.literal("")),
      endDate: z.string().optional().or(z.literal("")),
      amount: optionalAmount(t("messages.errors.contract_amount_invalid")),
      currency: z.string().optional().or(z.literal("")),
      paymentFrequency: z
        .enum(PAYMENT_FREQUENCIES)
        .optional()
        .or(z.literal("")),
      deposit: optionalAmount(t("messages.errors.contract_amount_invalid")),
      notes: z
        .string()
        .trim()
        .max(2000, { message: t("messages.errors.contract_notes_max_length") })
        .optional()
        .or(z.literal("")),
    })
    .refine(
      (values) =>
        !values.startDate ||
        !values.endDate ||
        new Date(values.endDate) >= new Date(values.startDate),
      {
        path: ["endDate"],
        message: t("messages.errors.contract_dates_invalid"),
      }
    );

export type ContractFormState = z.infer<ReturnType<typeof contractSchema>>;
