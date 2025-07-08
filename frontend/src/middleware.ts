import { auth, signOut } from "@/auth";
import { getToken } from "next-auth/jwt";
import { privateRoutes } from "./routes";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isApiRoute = nextUrl.pathname.includes("/api");
  const isAuthPage = nextUrl.pathname.includes("/auth");
  const isPrivateRoute = privateRoutes.includes(nextUrl.pathname);
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  const isTokenExpired =
    token &&
    (Date.now() >= token.data.validity?.refresh_until * 1000 ||
      token.error === "RefreshTokenExpired");

  // Skip middleware for api routes
  if (isApiRoute) return NextResponse.next();

  // Redirect to home if is auth page and user is logged in and token is not expired
  if (isAuthPage && isLoggedIn && !isTokenExpired)
    return NextResponse.redirect(new URL("/home", req.nextUrl.origin));

  // Clear session if is private route and token is expired and user is not logged in
  if (isPrivateRoute && (isTokenExpired || !isLoggedIn)) {
    const response = NextResponse.redirect(new URL("/auth/signout", req.nextUrl.origin));
    response.cookies.set("next-auth.session-token", "", { maxAge: 0 });
    response.cookies.set("next-auth.csrf-token", "", { maxAge: 0 });
    return response;
  }

  // Clear session if token is expired or user is not logged in
  if (isAuthPage && (isTokenExpired || !isLoggedIn)) {
    const response = NextResponse.next();
    // Clear all possible session cookies
    response.cookies.set("next-auth.session-token", "", { maxAge: 0 });
    response.cookies.set("next-auth.csrf-token", "", { maxAge: 0 });
    await signOut({ redirect: false });
    return response;
  }

  // TODO: Add role based access control (user can access only his own role data)
  // TODO: Add permission based access control (user can access only his own permission data)
  // TODO: Add user based access control (user can access only his own data)
  // TODO: Add tenant based access control (user can access only his own tenant data)
  // TODO: Add organization based access control (user can access only his own organization data)

  return NextResponse.next();
});

// Authenticate all routes except for /api, /_next/static, /_next/image, and .png files
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
