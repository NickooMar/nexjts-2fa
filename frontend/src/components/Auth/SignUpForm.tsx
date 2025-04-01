"use client";

import { Input } from "../ui/input";
import { Link } from "@/i18n/routing";
import { Button } from "../ui/button";
import { Loader } from "lucide-react";
import { useActionState } from "react";
import { ActionState } from "@/middleware";
import { useTranslations } from "next-intl";
import { signUp } from "@/app/actions/auth.actions";
import { PasswordInput } from "./Inputs/PasswordInput";
import { DotBackground } from "../Aceternity/DotBackground";

const SignUpForm: React.FC = () => {
  const t = useTranslations("signup");

  const [signUpState, signUpFormAction, signUpPending] = useActionState<
    ActionState,
    FormData
  >(signUp, { error: "" });

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <DotBackground>
        <section className="w-full max-w-xl mx-auto p-4 sm:p-6 md:p-8 z-0 bg-background border border-border rounded-xl shadow">
          <form action={signUpFormAction} className="space-y-5">
            <div className="flex flex-col justify-center items-center space-y-2 gap-2">
              <h3 className=" scroll-m-20 text-2xl font-semibold tracking-tight">
                {t("title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <section className="space-y-4">
              <div>
                <Input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required
                  aria-label="organizationName"
                  placeholder={t("organization.placeholder")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  aria-label="firstName"
                  placeholder={t("first_name.placeholder")}
                />
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  aria-label="lastName"
                  placeholder={t("last_name.placeholder")}
                />
              </div>
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
              <div>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  aria-label="confirmPassword"
                  placeholder={t("confirm_password.title")}
                  className="w-full"
                />
              </div>

              {signUpState?.error && (
                <p className="text-red-500">{signUpState.error}</p>
              )}

              <Button
                type="submit"
                className="w-full rounded-xl mt-4 p-4"
                disabled={signUpPending}
              >
                {signUpPending ? <Loader /> : t("create")}
              </Button>

              <div className="flex justify-center items-center gap-2">
                <p className="text-sm">{t("already_have_account")}</p>
                <Link
                  href="/signin"
                  className="text-sm text-secondary-action hover:underline"
                >
                  {t("signin")}
                </Link>
              </div>
            </section>
          </form>
        </section>
      </DotBackground>
    </div>
  );
};

export default SignUpForm;
