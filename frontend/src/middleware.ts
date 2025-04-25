import { auth } from "@/auth";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const locales = ["en", "es"];

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: "en",
});

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const publicPaths = ["/signup", "/signin", "/api/auth/callback/google"];
  const localePattern = new RegExp(`^\\/(${locales.join("|")})(\\/|$)`);

  // Check if the path is public or a locale path
  const isPublicPath =
    publicPaths.some((path) => pathname === path) ||
    localePattern.test(pathname);

  // If the path is public, pass the request to intlMiddleware
  if (isPublicPath) return intlMiddleware(req);

  // Redirect unauthenticated users to /signin if not on a public path
  if (!req.auth && !publicPaths.includes(pathname)) {
    const newUrl = new URL("/signin", req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  // For all other paths, validate authentication
  if (!req.cookies.get("authToken") || !req.auth) {
    const newUrl = new URL("/signin", req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  // Pass authenticated requests to intlMiddleware
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
