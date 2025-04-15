import z from "zod";
import { AuthProviders } from "@/types/auth/auth.types";

export const signInSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email" })
    .min(6, { message: "Email should be at least 4 characters" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(50),
});

export const signUpSchema = z
  .object({
    organizationName: z.string().min(3, { message: "Organization name must be at least 3 characters" }),
    firstName: z.string().min(3, { message: "First name must be at least 3 characters" }),
    lastName: z.string().min(3, { message: "Last name must be at least 3 characters" }),
    email: z
      .string()
      .email({ message: "Invalid email" })
      .min(6, { message: "Email should be at least 4 characters" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(50),
    confirmPassword: z
      .string()
      .min(8, { message: "Confirm password must be at least 8 characters" })
      .max(50),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords doesn't match",
    path: ["confirmPassword"],
  });

export const signInProviderSchema = z.object({
  provider: z.enum(Object.values(AuthProviders) as [string, ...string[]], {
    message: "Provider is invalid",
  }),
});
