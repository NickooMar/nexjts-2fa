"use client";

import { Loader } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ActionState } from "@/middleware";
import { useTranslations } from "next-intl";
import React, { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@mui/icons-material/Google";
import { Separator } from "@/components/ui/separator";
import { AuthProviders } from "@/types/auth/auth.types";
import { DotBackground } from "../Aceternity/DotBackground";
import { PasswordInput } from "@/components/Auth/Inputs/PasswordInput";
import { signIn, signInWithProvider } from "@/app/actions/auth.actions";

const SignInForm: React.FC = () => {
  const t = useTranslations("signin");

  const [signInState, signInFormAction, signInPending] = useActionState<
    ActionState,
    FormData
  >(signIn, { error: "" });

  async function handleSigninProviders(provider: AuthProviders) {
    await signInWithProvider(provider);
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <DotBackground>
        <section className="w-full max-w-md mx-auto p-4 sm:p-6 md:p-8 z-0 bg-background border border-border rounded-xl shadow">
          <form action={signInFormAction} className="space-y-5">
            <div className="flex flex-col justify-center items-center space-y-2 gap-2">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                {t("title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <section className="space-y-4">
              <div>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  required
                  aria-label="email"
                  placeholder={t("email.placeholder")}
                />
              </div>
              <div>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  aria-label="password"
                  placeholder={t("password.title")}
                  className="w-full"
                />
              </div>
              {/* DISABLE RESET PASSWORD FOR NOW */}
              {/* 
            <div className="flex justify-end">
            <Link
              href="/forgot"
              className="text-sm text-rose-600 hover:underline dark:text-white"
            >
              {t("forgot_password")}
            </Link>
          </div>
          */}

              {signInState?.error && (
                <p className="text-red-500">{signInState.error}</p>
              )}

              <Button
                type="submit"
                className="w-full rounded-xl mt-4 p-4"
                disabled={signInPending}
              >
                {signInPending ? <Loader /> : <>{t("login")}</>}
              </Button>
              <div className="flex justify-center items-center">
                <Separator className="w-[35%]" />
                <p className="text-sm text-muted-foreground mx-4 whitespace-nowrap">
                  {t("continue_with")}
                </p>
                <Separator className="w-[35%]" />
              </div>
              <div className="w-full grid grid-auto-fit-sm gap-4 place-content-center mt-5">
                <Button
                  type="button"
                  className="rounded-xl p-4"
                  onClick={async () =>
                    await handleSigninProviders(AuthProviders.Google)
                  }
                >
                  <GoogleIcon className="mx-2" />
                  {t("google_auth")}
                </Button>
              </div>
              <div className="flex justify-center items-center gap-2">
                <p className="text-sm">{t("not_registered")}</p>
                <Link
                  href="/signup"
                  className="text-sm text-secondary-action hover:underline"
                >
                  {t("create_account")}
                </Link>
              </div>
            </section>
          </form>
        </section>
      </DotBackground>
    </div>
  );
};

export default SignInForm;
