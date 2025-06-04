import NextAuth, {
  User,
  DecodedJWT,
  UserObject,
  AuthValidity,
} from "next-auth";
import {
  SignUpResponse,
  SignInResponse,
  SignUpFormState,
  RefreshTokenResponse,
} from "./types/auth/auth.types";

import axios from "axios";
import { JWT } from "next-auth/jwt";
import { jwtDecode } from "jwt-decode";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const $axios = axios.create({
  baseURL: `${process.env.NEST_BACKEND_PUBLIC_API_URL}/api/v1`,
  timeout: 10000,
});

/**
 * NextAuth configuration
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: {
    error: "/auth/error",
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-email",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password)
            throw new Error("missing_credentials");

          const { data: response } = await $axios.post<SignInResponse>(
            "/auth/signin",
            {
              email: credentials.email,
              password: credentials.password,
            }
          );

          if (!response.success || Object.keys(response.tokens).length === 0)
            throw new Error("request_error");

          const access: DecodedJWT = jwtDecode(response.tokens.accessToken);
          const refresh: DecodedJWT = jwtDecode(response.tokens.refreshToken);

          const user: UserObject = {
            _id: access._id,
            email: access.email,
            username: access.username,
            lastName: access.lastName,
            firstName: access.firstName,
          };

          const validity: AuthValidity = {
            valid_until: access.exp,
            refresh_until: refresh.exp,
          };

          return {
            user,
            validity,
            id: access._id,
            tokens: {
              accessToken: response.tokens.accessToken,
              refreshToken: response.tokens.refreshToken,
            },
          } as User;
        } catch (error) {
          console.error(error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial signin contains a 'User' object from authorize method
      if (user && account) {
        console.debug("Initial signin");
        return { ...token, data: user as User };
      }

      // The current access token is still valid
      if (Date.now() < token.data.validity?.valid_until * 1000) {
        console.debug("Access token is still valid");
        return token;
      }

      // The current access token has expired, but the refresh token is still valid
      if (Date.now() < token.data?.validity?.refresh_until * 1000) {
        console.debug("Access token is being refreshed");
        return await refreshAccessToken(token);
      }

      console.debug("Both tokens have expired");
      return {
        ...token,
        error: "RefreshTokenExpired",
      } as JWT;
    },
    async session({ session, token }) {
      return {
        ...session,
        error: token.error,
        user: token.data?.user,
        validity: token.data?.validity,
      };
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});

/**
 * Sign up the user
 * @param data - The data to sign up
 * @returns The response from the server
 */
export const signUp = async (
  data: SignUpFormState
): Promise<SignUpResponse> => {
  try {
    const response = await $axios.post("/auth/signup", data);
    return { success: true, data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        status: error.response.status,
        error: error.response.data?.error || "unknown_error",
        message: error.response.data?.message || "An error occurred.",
      };
    }

    return {
      success: false,
      status: undefined,
      error: "network_error",
      message: "No response from the server or unexpected error.",
    };
  }
};

/**
 * Check if the email exists
 * @param email - The email to check
 * @returns The response from the server
 */
export const checkEmailExists = async (email: string) => {
  const response = await $axios.get(`/auth/check-email`, {
    params: { email },
  });
  return response.data;
};

/**
 * Verify the email verification token
 * @param token - The token to verify
 * @returns The response from the server
 */
export const verifyEmailVerificationToken = async (token: string) => {
  const response = await $axios.get(`/auth/verify-email-verification-token`, {
    params: { token },
  });
  return response.data;
};

/**
 * Verify the email verification code
 * @param code - The code to verify
 * @param token - The token to verify
 * @returns The response from the server
 */
export const verifyEmailVerificationCode = async (
  code: string,
  token: string
) => {
  const response = await $axios.post(`/auth/verify-email`, {
    code,
    token,
  });
  return response.data;
};

/**
 * Resend the email verification code
 * @param token - The token to resend the code
 * @returns The response from the server
 */
export const resendEmailVerificationCode = async (token: string) => {
  const response = await $axios.post(`/auth/resend-email-verification-code`, {
    token,
  });
  return response.data;
};

/**
 * Refresh the access token
 * @param nextAuthJWT - The next-auth JWT
 * @returns The refreshed JWT
 */
async function refreshAccessToken(nextAuthJWT: JWT): Promise<JWT> {
  try {
    if (!nextAuthJWT.data?.tokens?.refreshToken) {
      throw new Error("No refresh token available");
    }

    // Get a new access token from backend using the refresh token
    const { data: response } = await $axios.post<RefreshTokenResponse>(
      `/auth/refresh-token`,
      {
        refreshToken: nextAuthJWT.data.tokens.refreshToken,
      }
    );

    if (!response.success || !response.tokens) {
      throw new Error("Failed to refresh token");
    }

    // Validate the new access token
    const decodedToken: DecodedJWT = jwtDecode(response.tokens.accessToken);

    if (!decodedToken.exp || Date.now() >= decodedToken.exp * 1000) {
      throw new Error("New access token is already expired");
    }

    // Create a new JWT object with updated values
    return {
      ...nextAuthJWT,
      data: {
        ...nextAuthJWT.data,
        validity: {
          ...nextAuthJWT.data.validity,
          valid_until: decodedToken.exp,
        },
        tokens: {
          ...nextAuthJWT.data.tokens,
          accessToken: response.tokens.accessToken,
        },
      },
    };
  } catch (error) {
    console.error(
      "Token refresh failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Return a standardized error state that will trigger a redirect
    return {
      ...nextAuthJWT,
      data: {} as User,
      error: "RefreshTokenExpired",
      errorDetails: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
