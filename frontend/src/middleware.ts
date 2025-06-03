// import { auth } from "@/auth";
// import { getToken } from "next-auth/jwt";

// export default auth(async (req) => {
//   const token = await getToken({ req, secret: process.env.AUTH_SECRET });
//   const newUrl = new URL("/signin", req.nextUrl.origin);

//   // Handle both expired tokens and refresh failures
//   if (token?.error === "RefreshTokenExpired") {
//     console.debug("Auth failed:", token.errorDetails || "Tokens expired");
//     return Response.redirect(newUrl);
//   }

//   const isAuthPage =
//     req.nextUrl.pathname.startsWith("/signin") ||
//     req.nextUrl.pathname.startsWith("/signup") ||
//     req.nextUrl.pathname.startsWith("/verify-email");

//   // If the user is on an auth page and is already logged in,
//   // redirect them to the home page
//   if (isAuthPage && req.auth) {
//     return Response.redirect(new URL("/home", req.nextUrl.origin));
//   }

//   // If the user is not on an auth page and is not logged in,
//   // redirect them to the signin page
//   if (!isAuthPage && !req.auth) {
//     return Response.redirect(newUrl);
//   }
// });

// // Authenticate all routes except for /api, /_next/static, /_next/image, and .png files
// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
// };

import { auth } from "@/auth";
import { privateRoutes } from "./routes";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  console.log({ token });

  const isApiRoute = nextUrl.pathname.includes("/api");
  const isAuthPage = nextUrl.pathname.includes("/auth");
  const isPrivateRoute = privateRoutes.includes(nextUrl.pathname);

  /** API ROUTES **/
  if (isApiRoute) return NextResponse.next();

  /** AUTH PAGES **/
  if (isAuthPage) {
    if (isLoggedIn) {
      const newUrl = new URL("/home", req.nextUrl.origin);
      return NextResponse.redirect(newUrl);
    }

    return NextResponse.next();
  }

  /** PRIVATE ROUTES **/
  if (isPrivateRoute && !isLoggedIn) {
    const newUrl = new URL("/auth/signin", req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  /** PUBLIC ROUTES **/
  if (!isPrivateRoute && isLoggedIn) {
    const newUrl = new URL("/home", req.nextUrl.origin);
    return NextResponse.redirect(newUrl);
  }

  // OK
  //  {
  //   token: {
  //   sub: '6834ee575a39d2da6d64888e',
  //   data: {
  //   user: {
  //   _id: '6834ee575a39d2da6d64888e',
  //   email: 'nicoo.marsili@gmail.com',
  //   username: 'test test',
  //   lastName: 'test',
  //   firstName: 'test'
  // },
  //   validity: { valid_until: 1748910782, refresh_until: 1748910827 },
  //   id: '6834ee575a39d2da6d64888e',
  //   tokens: {
  //   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODM0ZWU1NzVhMzlkMmRhNmQ2NDg4OGUiLCJzdWIiOiI2ODM0ZWU1NzVhMzlkMmRhNmQ2NDg4OGUiLCJlbWFpbCI6Im5pY29vLm1hcnNpbGlAZ21haWwuY29tIiwibGFzdE5hbWUiOiJ0ZXN0IiwiZmlyc3ROYW1lIjoidGVzdCIsInVzZXJuYW1lIjoidGVzdCB0ZXN0IiwiaWF0IjoxNzQ4OTEwNzY3LCJleHAiOjE3NDg5MTA3ODJ9.IMumpnAakWq73oXTdwlqBg_Fdz-LyGLRlmBoJMuvtVg',
  //   refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODM0ZWU1NzVhMzlkMmRhNmQ2NDg4OGUiLCJzdWIiOiI2ODM0ZWU1NzVhMzlkMmRhNmQ2NDg4OGUiLCJlbWFpbCI6Im5pY29vLm1hcnNpbGlAZ21haWwuY29tIiwibGFzdE5hbWUiOiJ0ZXN0IiwiZmlyc3ROYW1lIjoidGVzdCIsInVzZXJuYW1lIjoidGVzdCB0ZXN0IiwiaWF0IjoxNzQ4OTEwNzY3LCJleHAiOjE3NDg5MTA4Mjd9.0ciohjI2LWyM8K9JT26iflckdytt-SGUUumr8aWCThk'
  // }
  // },
  //   iat: 1748910779,
  //   exp: 1751502779,
  //   jti: 'da976ff1-1519-473d-9482-f9d46583912b'
  // }
  // }

  // REFRESH TOKEN EXPIRED REQUEST FAILED
  // {
  //   token: {
  //   sub: '6834ee575a39d2da6d64888e',
  //   data: {},
  //   iat: 1748910816,
  //   exp: 1751502816,
  //   jti: 'fa31f54b-ab2f-4019-aa77-db8cd4621a88',
  //   error: 'RefreshTokenExpired',
  //   errorDetails: 'Request failed with status code 404'
  // }
  // }

  /** DEFAULT **/
  return NextResponse.next();
});

// Authenticate all routes except for /api, /_next/static, /_next/image, and .png files
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
