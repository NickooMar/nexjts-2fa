"use server";

import { ActionState, validatedAction } from "@/middleware";
import { signInSchema, signUpSchema } from "@/types/auth/auth.schemas";
import { AuthProviders } from "@/types/auth/auth.types";
import { signIn as ProviderSignin, signOut } from "@/auth";
import { signIn as nextAuthSignIn } from "@/auth";

export const signUp = validatedAction(
  signUpSchema,
  async (data: {
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<ActionState> => {
    try {
      console.log({ data });
      return {};
    } catch (error) {
      console.error(error);
      return { error: "An unexpected error occurred" };
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
      return { error: "An unexpected error occurred" };
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
