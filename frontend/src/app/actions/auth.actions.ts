"use server";

import { signInSchema, signUpSchema } from "@/types/auth/auth.schemas";
import { AuthProviders, SignUpFormState } from "@/types/auth/auth.types";
import { signIn as ProviderSignin, signOut } from "@/auth";
import { signIn as nextAuthSignIn } from "@/auth";
import { ActionState, validatedAction } from "@/middleware";
import { z } from "zod";

type SignUpData = z.infer<typeof signUpSchema>;

export const signUp = validatedAction(
  signUpSchema,
  async (data: SignUpData): Promise<SignUpFormState> => {
    try {
      const { confirmPassword: _, ...signUpData } = data;

      // Example implementation:
      // await createUser(signUpData);
      console.log("Processing signup for:", signUpData);

      return {
        error: "",
        fieldErrors: {},
      };
    } catch (err) {
      const error = err as Error;
      console.error("Sign up error:", error);

      return {
        error: "Something went wrong. Please try again.",
        fieldErrors: {},
      };
    }
  }
);

export const signIn = validatedAction(
  signInSchema,
  async (data: { email: string; password: string }): Promise<ActionState> => {
    try {
      return await nextAuthSignIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
    } catch (error) {
      console.error("Sign in error:", error);
      return { error: "An unexpected error occurred", fieldErrors: {} };
    }
  }
);

export const signInWithProvider = async (provider: AuthProviders) => {
  if (!provider) return;
  await ProviderSignin(provider);
};

export const signOutAction = async () => {
  await signOut();
};
