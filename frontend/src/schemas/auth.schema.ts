import z from "zod";
import { AuthProviders } from "@/types/auth/auth.types";

export const createSignInSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .email({ message: t("messages.errors.invalid_email") })
      .min(6, { message: t("messages.errors.email_min_length") }),
    password: z.string().min(4, {
      message: t("messages.errors.password_invalid"),
    }),
  });

export const createSignUpSchema = (t: (key: string) => string) =>
  z
    .object({
      organizationName: z.string().min(3, {
        message: t("messages.errors.organization_name_min_length"),
      }),
      firstName: z
        .string()
        .min(3, { message: t("messages.errors.first_name_min_length") }),
      lastName: z
        .string()
        .min(3, { message: t("messages.errors.last_name_min_length") }),
      email: z
        .string()
        .email({ message: t("messages.errors.invalid_email") })
        .min(6, { message: t("messages.errors.email_min_length") }),
      password: z
        .string()
        .min(8, { message: t("messages.errors.password_min_length") })
        .max(20, { message: t("messages.errors.password_max_length") })
        .regex(/[A-Z]/, {
          message: t("messages.errors.password_uppercase"),
        })
        .regex(/[a-z]/, {
          message: t("messages.errors.password_lowercase"),
        })
        .regex(/[\d]/, { message: t("messages.errors.password_number") })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, {
          message: t("messages.errors.password_special_character"),
        })
        .refine((value) => !/^[.\n]/.test(value), {
          message: t("messages.errors.password_invalid_start"),
        }),
      confirmPassword: z
        .string()
        .min(8, {
          message: t("messages.errors.confirm_password_min_length"),
        })
        .max(50),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("messages.errors.passwords_dont_match"),
      path: ["confirmPassword"],
    });

export const createSignInProviderSchema = (t: (key: string) => string) =>
  z.object({
    provider: z.enum(Object.values(AuthProviders) as [string, ...string[]], {
      message: t("messages.errors.invalid_provider"),
    }),
  });
