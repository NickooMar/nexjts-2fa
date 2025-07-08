"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useNextToast } from "@/hooks/toasts/useNextToast";

export function SessionChecker() {
  const toast = useNextToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    // If we have a session but it has an error, or if status is unauthenticated
    // but we previously had a session, force a sign out
    if (
      session?.error === "RefreshTokenExpired" ||
      (status === "unauthenticated" && session === null)
    ) {
      signOut({ redirect: false });
    }
  }, [session?.error, status, session, toast]);

  return null;
}
