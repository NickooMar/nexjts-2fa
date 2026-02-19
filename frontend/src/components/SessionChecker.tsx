"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

export function SessionChecker() {
  const { data: session, status } = useSession();
  const hasBeenAuthenticatedRef = useRef(false);
  const hasTriggeredSignOutRef = useRef(false);

  useEffect(() => {
    if (status === "authenticated") {
      hasBeenAuthenticatedRef.current = true;
      hasTriggeredSignOutRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (hasTriggeredSignOutRef.current) {
      return;
    }

    if (session?.error === "RefreshTokenExpired") {
      hasTriggeredSignOutRef.current = true;
      signOut({ redirect: false });
      return;
    }

    // Handle only real auth regressions (authenticated -> unauthenticated).
    if (status === "unauthenticated" && hasBeenAuthenticatedRef.current) {
      hasTriggeredSignOutRef.current = true;
      signOut({ redirect: false });
    }
  }, [session?.error, status]);

  return null;
}
