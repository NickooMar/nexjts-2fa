import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const locales = ["en", "es"];
const PUBLIC_FILE = /\.(.*)$/;

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: "en",
});

export async function middleware(req: NextRequest) {
  const { pathname, locale, search } = req.nextUrl;

  // Handle public files, API routes, and `_next` paths
  if (
    pathname.startsWith("/_next") ||
    pathname.includes("/api/") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return;
  }

  // Redirect to the appropriate locale if the locale is `default`
  if (locale === "default") {
    const userLocale = req.cookies.get("NEXT_LOCALE")?.value || "en";
    return NextResponse.redirect(
      new URL(`/${userLocale}${pathname}${search}`, req.url)
    );
  }

  // Authentication logic
  const publicPaths = ["/signup", "/signin", "/api/auth/callback/google"];
  const localePattern = new RegExp(`^\\/(${locales.join("|")})(\\/|$)`);

  // Check if the path is public or a locale path
  const isPublicPath =
    publicPaths.some((path) => pathname === path) ||
    localePattern.test(pathname);

  // If the path is public, pass the request to intlMiddleware
  if (isPublicPath) return intlMiddleware(req);

  // Redirect unauthenticated users to /signin if not on a public path
  if (!req.cookies.get("authToken")) {
    const newUrl = new URL("/signin", req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  // Pass authenticated requests to intlMiddleware
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
