import {
  QueryCache,
  QueryClient,
  MutationCache,
  isServer,
} from "@tanstack/react-query";
import { showToast } from "nextjs-toast-notify";
import { ApiError, isNonRetryableError } from "./types";

const toastOptions = {
  duration: 4000,
  progress: true,
  position: "top-right",
  transition: "popUp",
  sound: false,
} as const;

/**
 * Resolves the user-facing error message for a failed mutation: an explicit
 * per-code mapping wins, then the generic per-mutation message, then the raw
 * error code as a last resort.
 */
function resolveErrorMessage(
  error: Error,
  meta?: { errorMessage?: string; errorMessages?: Record<string, string> }
): string {
  if (meta?.errorMessages && error instanceof ApiError) {
    const match = Object.keys(meta.errorMessages).find((code) =>
      error.code.includes(code)
    );
    if (match) return meta.errorMessages[match];
  }
  return meta?.errorMessage ?? error.message;
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 1 minute: remounts and window focus
        // within that window are served from cache with no network request.
        staleTime: 60 * 1000,
        // Unused cache entries are garbage-collected after 5 minutes.
        gcTime: 5 * 60 * 1000,
        // Retry transient failures twice (with exponential backoff); auth and
        // permission errors are terminal, so retrying is skipped for them.
        retry: (failureCount, error) =>
          failureCount < 2 && !isNonRetryableError(error),
        // Stale data refreshes in the background when the user returns to the
        // tab or the network reconnects; fresh data does not refetch.
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        // Mutations are never retried automatically: the server may have
        // already applied the write.
        retry: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only surface errors for queries that have no data to fall back on;
        // background refetch failures keep showing cached data silently.
        if (query.state.data !== undefined) return;
        if (query.meta?.errorMessage) {
          showToast.error(query.meta.errorMessage, toastOptions);
        }
      },
    }),
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        if (mutation.meta?.successMessage) {
          showToast.success(mutation.meta.successMessage, toastOptions);
        }
      },
      onError: (error, _variables, _context, mutation) => {
        const message = resolveErrorMessage(error, mutation.meta);
        showToast.error(message, toastOptions);
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Server: always a fresh client (no state shared across requests).
 * Browser: a singleton, so the cache survives React suspending during the
 * initial render and re-creating the provider tree.
 */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
