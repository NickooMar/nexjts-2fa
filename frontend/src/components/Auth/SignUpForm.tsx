"use client";

import { Input } from "../ui/input";
import { Link } from "@/i18n/routing";
import { Button } from "../ui/button";
import { Loader } from "lucide-react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signUp } from "@/app/actions/auth.actions";
import { PasswordInput } from "./Inputs/PasswordInput";
import { DotBackground } from "../Aceternity/DotBackground";
import { SignUpFormState } from "@/types/auth/auth.types";
import { Alert, AlertDescription } from "../ui/alert";

const SignUpForm: React.FC = () => {
  const t = useTranslations("signup");

  const [signUpState, signUpFormAction, signUpPending] = useActionState<
    SignUpFormState,
    FormData
  >(signUp, { error: "", fieldErrors: {} });

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <DotBackground>
        <section className="w-full max-w-xl mx-auto p-4 sm:p-6 md:p-8 z-0 bg-card border border-border rounded-xl shadow">
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
                {signUpState?.fieldErrors?.organizationName && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      {signUpState.fieldErrors.organizationName}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    aria-label="firstName"
                    placeholder={t("first_name.placeholder")}
                  />
                  {signUpState?.fieldErrors?.firstName && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertDescription>
                        {signUpState.fieldErrors.firstName}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    aria-label="lastName"
                    placeholder={t("last_name.placeholder")}
                  />
                  {signUpState?.fieldErrors?.lastName && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertDescription>
                        {signUpState.fieldErrors.lastName}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
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
                {signUpState?.fieldErrors?.email && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      {signUpState.fieldErrors.email}
                    </AlertDescription>
                  </Alert>
                )}
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
                {signUpState?.fieldErrors?.password && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      {signUpState.fieldErrors.password}
                    </AlertDescription>
                  </Alert>
                )}
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
                {signUpState?.fieldErrors?.confirmPassword && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      {signUpState.fieldErrors.confirmPassword}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

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
                  className="text-sm text-secondary-action underline"
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
