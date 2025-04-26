"use server";

import {
  AuthProviders,
  SignInFormState,
  SignUpFormState,
} from "@/types/auth/auth.types";
import { signIn, signOut, signUp, checkEmailExists } from "@/auth";

// SIGN IN RELATED ACTIONS
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

export const checkEmailExistsAction = async (email: string) => {
  const response = await checkEmailExists(email);
  return response;
};

export const signInWithProviderAction = async (provider: AuthProviders) => {
  if (!provider) return;
  await signIn(provider);
};

// SIGN UP RELATED ACTIONS
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

// SIGN OUT RELATED ACTIONS
export const signOutAction = async () => {
  await signOut();
};
