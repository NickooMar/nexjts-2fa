import {
  createSignInSchema,
  createSignUpSchema,
  createEmailVerificationSchema,
} from "@/schemas/auth.schema";

import { z } from "zod";

export type SignUpFormState = z.infer<ReturnType<typeof createSignUpSchema>>;
export type SignInFormState = z.infer<ReturnType<typeof createSignInSchema>>;
export type EmailVerificationFormState = z.infer<
  ReturnType<typeof createEmailVerificationSchema>
>;

export enum AuthProviders {
  Google = "google",
}

export type SignUpResponse = {
  success: boolean;
  data?: {
    success: boolean;
    verificationToken: string;
    userId: string;
    message: string;
  };
  error?: string;
  message?: string;
  status?: number;
};

export type VerifyEmailVerificationTokenResponse = {
  success: boolean;
  error?: string;
  message?: string;
};

export type SignInResponse = {
  success: boolean;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

export type RefreshTokenResponse = {
  success: boolean;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};