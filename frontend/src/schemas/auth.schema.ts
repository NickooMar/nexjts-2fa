import z from "zod";
import { AuthProviders } from "@/types/auth/auth.types";

export const createSignInSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .email({ message: t("auth.messages.errors.invalid_email") })
      .min(6, { message: t("auth.messages.errors.email_min_length") }),
    password: z.string().min(1, {
      message: t("auth.messages.errors.password_required"),
    }),
  });

export const createSignUpSchema = (t: (key: string) => string) =>
  z
    .object({
      organizationName: z.string().min(3, {
        message: t("auth.messages.errors.organization_name_min_length"),
      }),
      firstName: z
        .string()
        .min(3, { message: t("auth.messages.errors.first_name_min_length") }),
      lastName: z
        .string()
        .min(3, { message: t("auth.messages.errors.last_name_min_length") }),
      email: z
        .string()
        .email({ message: t("auth.messages.errors.invalid_email") })
        .min(6, { message: t("auth.messages.errors.email_min_length") }),
      password: z
        .string()
        .min(8, { message: t("auth.messages.errors.password_min_length") })
        .max(20, { message: t("auth.messages.errors.password_max_length") })
        .regex(/[A-Z]/, {
          message: t("auth.messages.errors.password_uppercase"),
        })
        .regex(/[a-z]/, {
          message: t("auth.messages.errors.password_lowercase"),
        })
        .regex(/[\d]/, { message: t("auth.messages.errors.password_number") })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, {
          message: t("auth.messages.errors.password_special_character"),
        })
        .refine((value) => !/^[.\n]/.test(value), {
          message: t("auth.messages.errors.password_invalid_start"),
        }),
      confirmPassword: z
        .string()
        .min(8, {
          message: t("auth.messages.errors.confirm_password_min_length"),
        })
        .max(50),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.messages.errors.passwords_dont_match"),
      path: ["confirmPassword"],
    });

export const createSignInProviderSchema = (t: (key: string) => string) =>
  z.object({
    provider: z.enum(Object.values(AuthProviders) as [string, ...string[]], {
      message: t("auth.messages.errors.invalid_provider"),
    }),
  });
