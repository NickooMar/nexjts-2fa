"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function SignOutPage() {
  useEffect(() => {
    const logout = async () => {
      await signOut({ redirect: true, callbackUrl: "/auth/signin" });
    };
    logout();
  }, []);

  return <div>Signing out...</div>;
}
