"use server";

import {
  AuthProviders,
  SignInFormState,
  SignUpFormState,
} from "@/types/auth/auth.types";
import { signIn as nextAuthSignIn } from "@/auth";
import { signIn as ProviderSignin, signOut } from "@/auth";
import { signInSchema, signUpSchema } from "@/schemas/auth.schema";

export const signUpAction = async (data: SignUpFormState) => {
  const result = signUpSchema.safeParse(data);

  if (!result.success) {
    console.error(result.error);
    return { error: "Validation failed" };
  }

  return { success: true };
};

export const signInAction = async (data: SignInFormState) => {
  const result = signInSchema.safeParse(data);

  if (!result.success) {
    console.error(result.error);
    return { error: "Validation failed" };
  }

  console.log("Processing signin for:", data);
  // return await nextAuthSignIn("credentials", {
  //   email: data.email,
  //   password: data.password,
  //   redirect: false,
  // });
};

export const signInWithProvider = async (provider: AuthProviders) => {
  if (!provider) return;
  await ProviderSignin(provider);
};

export const signOutAction = async () => {
  await signOut();
};
