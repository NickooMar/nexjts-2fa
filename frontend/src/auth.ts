import {
  AuthProviders,
  SignUpResponse,
  SignUpFormState,
} from "./types/auth/auth.types";

import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Google from "next-auth/providers/google";
import NextAuth, { DefaultSession, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

interface AuthUser extends User {
  accessToken?: string;
  username?: string;
}

interface CustomSession extends DefaultSession {
  accessToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
  } & DefaultSession["user"];
}

const $axios = axios.create({
  baseURL: `${process.env.NEST_BACKEND_PUBLIC_API_URL}/api/v1`,
  timeout: 10000,
});

/**
 * NextAuth configuration
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.accessToken = (user as AuthUser).accessToken;
      }
      return token;
    },
    async session({ session, token }): Promise<CustomSession> {
      if (token) {
        (session as CustomSession).accessToken = token.accessToken as string;
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
        };
      }
      return session as CustomSession;
    },
    async signIn({ account }) {
      // Simplified signIn callback
      if (!account) return false;

      if (account.type === "credentials") {
        return true;
      }

      if (account.provider === AuthProviders.Google) {
        return true;
      }

      return false;
    },
    async authorized({ auth, request }) {
      // Handle auth for API routes
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return !!auth?.user;
      }

      return true; // Let middleware handle the auth for pages
    },
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
      async authorize(credentials): Promise<AuthUser | null> {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const { data } = await $axios.post("/auth/signin", {
            email: credentials.email,
            password: credentials.password,
          });

          if (!data) throw new Error("Invalid credentials");

          const access: { id: string; email: string; username: string } =
            jwtDecode(data.accessToken);

          return {
            id: access.id,
            email: access.email,
            name: access.username,
            accessToken: data.accessToken,
          };
        } catch (error: unknown) {
          throw new Error(`Failed to sign in: ${error}`);
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
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
