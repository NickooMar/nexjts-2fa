"use server";

import {
  AuthProviders,
  SignInFormState,
  SignUpFormState,
} from "@/types/auth/auth.types";
import axios from "axios";
import { signIn, signOut } from "@/auth";
import { signInSchema, signUpSchema } from "@/schemas/auth.schema";

const $axios = axios.create({
  baseURL: `${process.env.NEST_BACKEND_PUBLIC_API_URL}/api/v1`,
});

export const signUpAction = async (data: SignUpFormState) => {
  console.log({ data });
  const result = signUpSchema.safeParse(data);

  if (!result.success) {
    console.error(result.error);
    return { error: "Validation failed" };
  }

  try {
    const response = await $axios.post("/auth/signup", data, {
      timeout: 10000,
    });

    console.log({ response });

    // if (response.status !== 200) {
    //   throw new Error("Signup failed");
    // }

    return { success: true };
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return { error: "Failed to create account" };
  }
};

export const signInAction = async (data: SignInFormState) => {
  const result = signInSchema.safeParse(data);

  if (!result.success) {
    console.error(result.error);
    return { error: "Validation failed" };
  }

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
