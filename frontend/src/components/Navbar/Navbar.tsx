import React from "react";
import { auth } from "@/auth";
import { Link } from "@/i18n/routing";
import { Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth.actions";
import { ThemeSwitcher } from "../Theme/ThemeSwitcher";

async function handleSignOut() {
  "use server";
  await signOutAction();
}

const Navbar = async () => {
  const session = await auth();

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
          {session?.user ? (
            <form action={handleSignOut}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-6 w-6" />
                <span>Logout</span>
              </Button>
            </form>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
