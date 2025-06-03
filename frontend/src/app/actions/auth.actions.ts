"use server";

import {
  AuthProviders,
  SignUpResponse,
  SignUpFormState,
  SignInFormState,
} from "@/types/auth/auth.types";
import {
  signIn,
  signUp,
  signOut,
  checkEmailExists,
  verifyEmailVerificationToken,
  verifyEmailVerificationCode,
  resendEmailVerificationCode,
} from "@/auth";

import { AxiosError } from "axios";

/**
 * Sign in the user
 * @param data - The data to sign in
 * @returns The response from the server
 */
export const signInAction = async (data: SignInFormState) => {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return {
      success: false,
      error: "invalid_credentials",
    };
  }
};

/**
 * Check if the email exists
 * @param email - The email to check
 * @returns The response from the server
 */
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

/**
 * Sign in with a provider
 * @param provider - The provider to sign in with
 * @returns The response from the server
 */
export const signInWithProviderAction = async (provider: AuthProviders) => {
  if (!provider) return;
  await signIn(provider);
};

/**
 * Sign up the user
 * @param data - The data to sign up
 * @returns The response from the server
 */
export const signUpAction = async (
  data: SignUpFormState
): Promise<SignUpResponse> => {
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

/**
 * Verify the email verification token
 * @param token - The token to verify
 * @returns The response from the server
 */
export const verifyEmailVerificationTokenAction = async (token: string) => {
  try {
    const response = await verifyEmailVerificationToken(token);
    return response;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if ([400, 401, 404].includes(error.response?.status ?? 0)) {
        return {
          success: false,
          error: "invalid_token",
          message: "Invalid token",
        };
      } else if (error.response?.data.message) {
        return {
          success: false,
          error: "invalid_token",
          message: error.response?.data.message,
        };
      }
    }

    return {
      success: false,
      error: "server_error",
      message: "Unknown error",
    };
  }
};

/**
 * Verify the email verification code
 * @param code - The code to verify
 * @returns The response from the server
 */
export const verifyEmailVerificationCodeAction = async (
  code: string,
  token: string
) => {
  try {
    const response = await verifyEmailVerificationCode(code, token);
    return response;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        error: error.response?.data.error || "unknown_error",
        message: error.response?.data.message || "An error occurred.",
      };
    }

    return {
      success: false,
      error: "server_error",
      message: "Unknown error",
    };
  }
};

/**
 * Resend the email verification code
 * @param email - The email to resend the code
 * @returns The response from the server
 */
export const resendEmailVerificationCodeAction = async (token: string) => {
  try {
    const response = await resendEmailVerificationCode(token);
    return response;
  } catch (error: unknown) {
    console.error(error);
    return {
      success: false,
      error: "server_error",
      message: "Unknown error",
    };
  }
};

/**
 * Sign out the user
 * @returns The response from the server
 */
export const signOutAction = async () => {
  await signOut();
};

/**
 * Refresh the access token by sending a POST request to the backend using the supplied refresh token.
 * @param token The current refresh token
 * @returns A BackendAccessJWT response from the backend.
 */
export const refreshTokenAction = async () => {
  // await refreshToken();
};
