"use server";

import {
  AuthProviders,
  SignInFormState,
  SignUpFormState,
} from "@/types/auth/auth.types";
import { signIn, signOut, signUp, checkEmailExists } from "@/auth";
import { AxiosError } from "axios";

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
  try {
    const response = await checkEmailExists(email);
    return response;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if ([400, 401, 404].includes(error.response?.status ?? 0)) {
        return {
          success: false,
          error: "invalid_credentials",
          message: "Email does not exist",
        };
      }
    }

    return {
      success: false,
      error: "server_error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const signInWithProviderAction = async (provider: AuthProviders) => {
  if (!provider) return;
  await signIn(provider);
};

// SIGN UP RELATED ACTIONS
export const signUpAction = async (data: SignUpFormState) => {
  const result = await signUp(data);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      message: result.message,
    };
  }

  return result;
};

// SIGN OUT RELATED ACTIONS
export const signOutAction = async () => {
  await signOut();
};
