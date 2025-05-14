import { z } from "zod";
import {
  createSignInSchema,
  createSignUpSchema,
  createEmailVerificationSchema,
} from "@/schemas/auth.schema";

export type SignUpFormState = z.infer<ReturnType<typeof createSignUpSchema>>;
export type SignInFormState = z.infer<ReturnType<typeof createSignInSchema>>;
export type EmailVerificationFormState = z.infer<
  ReturnType<typeof createEmailVerificationSchema>
>;

export enum AuthProviders {
  Google = "google",
}
