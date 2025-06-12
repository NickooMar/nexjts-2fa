import { auth } from "@/auth";
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

  if (isApiRoute) {
    return NextResponse.next();
  }
  if (isAuthPage && isLoggedIn && !isTokenExpired) {
    return NextResponse.redirect(new URL("/home", req.nextUrl.origin));
  }
  if (isPrivateRoute && (isTokenExpired || !isLoggedIn)) {
    const response = NextResponse.redirect(
      new URL("/auth/signin", req.nextUrl.origin)
    );
    response.cookies.set("next-auth.session-token", "", { maxAge: 0 });
    response.cookies.set("next-auth.csrf-token", "", { maxAge: 0 });
    return response;
  }

  return NextResponse.next();
});

// Authenticate all routes except for /api, /_next/static, /_next/image, and .png files
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
