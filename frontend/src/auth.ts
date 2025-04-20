import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Google from "next-auth/providers/google";
import { AuthProviders } from "./types/auth/auth.types";
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
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

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

          const { data } = await $axios.post("/api/auth/signin", {
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
        } catch (error) {
          throw new Error(`Failed to sign in: ${error}`);
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
});
