import { auth } from "@/auth";

// Docker sets NEST_BACKEND_PUBLIC_API_URL (container DNS); local dev falls
// back to NEXT_PUBLIC_API_URL from .env.
const API_BASE_URL = `${
  process.env.NEST_BACKEND_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000"
}/api/v1`;

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

/**
 * Server-side fetch helper for tenant-scoped, authenticated gateway requests.
 *
 * It attaches the backend access token (which itself encodes the tenant) and an
 * `x-tenant-id` hint from the session. The gateway treats the JWT as the source
 * of truth for tenancy; the header is defense-in-depth / observability only.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const session = await auth();
  const accessToken = session?.accessToken;
  const tenantId = session?.user?.tenantId;

  if (!accessToken) {
    throw new Error("unauthenticated");
  }

  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `request_failed_${response.status}`);
  }

  return response.json() as Promise<T>;
}
