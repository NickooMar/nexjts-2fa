"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  checkout,
  changePlan,
  retryPayment,
  cancelSubscription,
  resumeSubscription,
} from "@/services/api/billing.api";

interface MutationMessages {
  successMessage?: string;
  errorMessage?: string;
  errorMessages?: Record<string, string>;
}

/** Every billing mutation invalidates the whole billing branch. */
function useInvalidateBilling() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.billing.all() });
}

export function useCheckout(
  options?: MutationMessages & {
    onSuccess?: (result: { checkoutUrl?: string }) => void;
  }
) {
  const invalidate = useInvalidateBilling();

  return useMutation({
    mutationFn: checkout,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: (result) => {
      // Hosted-checkout providers redirect; synchronous ones are done now.
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      invalidate();
      options?.onSuccess?.(result);
    },
  });
}

export function useChangePlan(
  options?: MutationMessages & { onSuccess?: () => void }
) {
  const invalidate = useInvalidateBilling();

  return useMutation({
    mutationFn: changePlan,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useCancelSubscription(
  options?: MutationMessages & { onSuccess?: () => void }
) {
  const invalidate = useInvalidateBilling();

  return useMutation({
    mutationFn: cancelSubscription,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useResumeSubscription(
  options?: MutationMessages & { onSuccess?: () => void }
) {
  const invalidate = useInvalidateBilling();

  return useMutation({
    mutationFn: resumeSubscription,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useRetryPayment(
  options?: MutationMessages & { onSuccess?: () => void }
) {
  const invalidate = useInvalidateBilling();

  return useMutation({
    mutationFn: retryPayment,
    meta: {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      errorMessages: options?.errorMessages,
    },
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}
