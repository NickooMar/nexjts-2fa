/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React from "react";
import { Loader } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@mui/icons-material/Google";
import { signInSchema } from "@/schemas/auth.schema";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { DotBackground } from "../Aceternity/DotBackground";
import { Form, FormField, FormItem, FormMessage } from "../ui/form";
import { PasswordInput } from "@/components/Auth/Inputs/PasswordInput";
import { AuthProviders, SignInFormState } from "@/types/auth/auth.types";
import { signInAction, signInWithProvider } from "@/app/actions/auth.actions";

const SignInForm: React.FC = () => {
  const t = useTranslations("signin");
  const { error: errorToast } = useToast();

  const form = useForm<SignInFormState>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function handleSigninProviders(provider: AuthProviders) {
    await signInWithProvider(provider);
  }

  const onSubmit: SubmitHandler<SignInFormState> = async (
    values: SignInFormState
  ) => {
    try {
      const result = await signInAction(values);

      console.log(result);
    } catch (error) {
      console.error(error);
      errorToast(t("messages.errors.invalid_data"));
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <DotBackground>
        <section className="w-full max-w-md mx-auto p-4 sm:p-6 md:p-8 z-0 bg-card border border-border rounded-xl shadow">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex flex-col justify-center items-center space-y-2 gap-2">
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  {t("title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("description")}
                </p>
              </div>
              <section className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Input
                        {...field}
                        type="email"
                        required
                        aria-label="email"
                        placeholder={t("email.placeholder")}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <PasswordInput
                        {...field}
                        id="password"
                        required
                        aria-label="password"
                        placeholder={t("password.title")}
                        className="w-full"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

                <Button
                  type="submit"
                  className="w-full rounded-xl mt-4 p-4"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? <Loader /> : t("login")}
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
                    className="text-sm text-secondary-action underline"
                  >
                    {t("create_account")}
                  </Link>
                </div>
              </section>
            </form>
          </Form>
        </section>
      </DotBackground>
    </div>
  );
};

export default SignInForm;
