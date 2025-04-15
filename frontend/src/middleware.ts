import { routing } from "./i18n/routing";
export { auth as middleware } from "@/auth";
import createMiddleware from "next-intl/middleware";

// Internationalized routing middleware
export default createMiddleware(routing);

// New route segment configuration
export const runtime = "experimental-edge";
export const matcher = ["/", "/(en|es)/:path*"];