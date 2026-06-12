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

export class ApiRequestError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, options: { status: number; details?: unknown }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.details = options.details;
  }
}

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
    const raw = await response.text().catch(() => response.statusText);
    const contentType = response.headers.get("content-type") ?? "";
    if (raw && contentType.includes("application/json")) {
      let payload:
        | {
            message?: string | string[];
            code?: string;
          }
        | null = null;
      try {
        payload = JSON.parse(raw) as {
          message?: string | string[];
          code?: string;
        };
      } catch {
        payload = null;
      }
      if (payload) {
        const message = Array.isArray(payload.message)
          ? payload.message.join(", ")
          : payload.code ?? payload.message ?? raw;
        throw new ApiRequestError(message, {
          status: response.status,
          details: payload,
        });
      }
    }
    throw new ApiRequestError(raw || `request_failed_${response.status}`, {
      status: response.status,
    });
  }

  return response.json() as Promise<T>;
}

/**
 * Multipart variant of {@link apiFetch} for file uploads. Content-Type is
 * left to fetch so the multipart boundary is set correctly.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: "POST" | "PUT" | "PATCH" } = {}
): Promise<T> {
  const session = await auth();
  const accessToken = session?.accessToken;
  const tenantId = session?.user?.tenantId;

  if (!accessToken) {
    throw new Error("unauthenticated");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => response.statusText);
    throw new ApiRequestError(raw || `request_failed_${response.status}`, {
      status: response.status,
    });
  }

  return response.json() as Promise<T>;
}
