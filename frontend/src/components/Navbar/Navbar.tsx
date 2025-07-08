"use client";

import React from "react";
import Link from "next/link";
import { Home, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "./LanguageSwitcher";
import { useSession, signOut } from "next-auth/react";
import { ThemeSwitcher } from "../Theme/ThemeSwitcher";

export const Navbar = () => {
  const t = useTranslations("navbar");
  const { data: session, status } = useSession({ required: false });

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-14 px-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Home className="h-6 w-6" />
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <Button variant="ghost" size="sm" disabled>
              Loading...
            </Button>
          ) : status === "authenticated" && session?.user ? (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-6 w-6" />
              <span>{t("signout")}</span>
            </Button>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  {t("signin")}
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" size="sm">
                  {t("signup")}
                </Button>
              </Link>
            </>
          )}
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};
