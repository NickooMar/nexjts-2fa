/**
 * Error codes the backend returns inside action result envelopes. Auth and
 * permission failures are terminal: retrying cannot succeed, so the query
 * client skips retries for them (see query-client.ts).
 */
export const NON_RETRYABLE_ERROR_CODES = [
  "unauthenticated",
  "insufficient_permissions",
  "missing_tenant_context",
  "invalid_invitation",
  "invitation_expired",
  "invitation_already_used",
  "already_a_member",
  "property_not_found",
] as const;

export type ApiErrorCode = (typeof NON_RETRYABLE_ERROR_CODES)[number] | string;

/**
 * Error thrown by the API service layer when a server action reports failure.
 * Server actions return `{ success: false, error }` envelopes instead of
 * throwing (Next.js redacts thrown errors in production); the service layer
 * converts those envelopes into ApiError instances so React Query gets real
 * errors for its retry / error-state machinery.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, details?: unknown) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }

  /** True when retrying is pointless (auth, permissions, not-found, ...). */
  get isNonRetryable(): boolean {
    return NON_RETRYABLE_ERROR_CODES.some((known) =>
      this.code.includes(known)
    );
  }
}

export function isNonRetryableError(error: unknown): boolean {
  return error instanceof ApiError && error.isNonRetryable;
}

/**
 * Per-query/mutation metadata read by the global Query/Mutation caches to
 * show toast notifications without every hook re-implementing them.
 */
declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Toast shown when the mutation succeeds. */
      successMessage?: string;
      /** Toast shown when the mutation fails (overrides the error code). */
      errorMessage?: string;
      /** Maps backend error codes to user-facing messages. */
      errorMessages?: Record<string, string>;
      /** Errors handled by the component itself (skip the global toast). */
      suppressErrorCodes?: string[];
    };
    queryMeta: {
      /** Toast shown when the query fails (background refetches stay silent). */
      errorMessage?: string;
    };
  }
}
