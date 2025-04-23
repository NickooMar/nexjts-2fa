"use server";

import {
  AuthProviders,
  SignInFormState,
  SignUpFormState,
} from "@/types/auth/auth.types";
import { signIn, signOut, signUp } from "@/auth";

export const signUpAction = async (data: SignUpFormState) => {
  try {
    const result = await signUp(data);

    console.log({ result });

    return { success: true };
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return { error: "Failed to create account" };
  }
};

export const signInAction = async (data: SignInFormState) => {
  try {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Invalid credentials" };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Sign in error:", error);
    return { error: "Failed to sign in" };
  }
};

export const signInWithProvider = async (provider: AuthProviders) => {
  if (!provider) return;
  await signIn(provider);
};

export const signOutAction = async () => {
  await signOut();
};
