/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  signInAction,
  checkEmailExistsAction,
  signInWithProviderAction,
} from "@/app/actions/auth.actions";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@mui/icons-material/Google";
import React, { useCallback, useState } from "react";
import { Edit, Mail, MailCheck } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "../Inputs/PasswordInput";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNextToast } from "@/hooks/toasts/useNextToast";
import { createSignInSchema } from "@/schemas/auth.schema";
import { Form, FormField, FormItem, FormMessage } from "../../ui/form";
import { AuthProviders, SignInFormState } from "@/types/auth/auth.types";
import { AuthError } from "next-auth";
import { useSession } from "next-auth/react";

const SignInForm: React.FC = () => {
  const router = useRouter();
  const toast = useNextToast();
  const t = useTranslations("auth");
  const session = useSession();
  const signInSchema = createSignInSchema(t);

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<"email" | "password">("email");

  const form = useForm<SignInFormState>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { trigger, clearErrors, resetField } = form;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  async function handleSigninProviders(provider: AuthProviders) {
    await signInWithProviderAction(provider);
  }

  const onNextStep = async () => {
    try {
      setIsLoading(true);

      const validEmailStep = await trigger("email");
      if (!validEmailStep) return;

      const response = await checkEmailExistsAction(form.getValues("email"));

      if (!response?.success) {
        if (response.error === "invalid_credentials") {
          return toast.error(t("messages.errors.invalid_credentials"));
        } else {
          return toast.error(t("messages.errors.request_error"));
        }
      }

      if (!response?.exists) {
        return toast.error(t("messages.errors.invalid_credentials"));
      }

      setStep("password");
    } catch (error) {
      console.error(error);
      toast.error(t("messages.errors.request_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit: SubmitHandler<SignInFormState> = async (
    values: SignInFormState
  ) => {
    try {
      setIsLoading(true);

      const response = await signInAction(values);

      if (response?.success) {
        toast.success(t("messages.success.signin_success"));
        router.push("/home");
        session.update(); // update session to get the new user data
        return;
      }

      if (response?.error === "invalid_credentials") {
        return toast.error(t("messages.errors.invalid_credentials"));
      }

      return toast.error(t("messages.errors.request_error"));
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.message) {
          case "CredentialsSignin":
            return toast.error(t("messages.errors.invalid_credentials"));
          default:
            return toast.error(t("messages.errors.request_error"));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackStep = useCallback(() => {
    clearErrors();
    setStep("email");
    resetField("password");
  }, [clearErrors, resetField]);

  const handleAction = useCallback(async () => {
    if (step === "email") await onNextStep();
  }, [step, onNextStep]);

  return (
    <section className="w-full max-w-md mx-auto p-8 bg-card backdrop-blur-sm bg-opacity-100 border border-border rounded-xl shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex flex-col justify-center items-center space-y-2 gap-2">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {t("signin.title")}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {t("signin.description")}
            </p>
          </div>
          <section className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Input
                      {...field}
                      type="email"
                      required
                      aria-label="email"
                      placeholder={t("signin.email.placeholder")}
                      disabled={step === "password"}
                      className="pr-10"
                      onChange={(e) => {
                        field.onChange(e);
                        setIsEmailValid(validateEmail(e.target.value));
                      }}
                    />
                    {step === "password" ? (
                      <Edit
                        className="absolute inset-y-0 right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:cursor-pointer"
                        onClick={handleBackStep}
                      />
                    ) : isEmailValid ? (
                      <MailCheck className="absolute inset-y-0 right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    ) : (
                      <Mail className="absolute inset-y-0 right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {step === "password" && (
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
                      placeholder={t("signin.password.title")}
                      className="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button
              type={step === "password" ? "submit" : "button"}
              className="w-full rounded-xl mt-4 p-4"
              disabled={isLoading}
              onClick={handleAction}
            >
              {isLoading ? <Spinner /> : t("signin.login")}
            </Button>
            <div className="flex justify-center items-center">
              <Separator className="w-[35%]" />
              <p className="text-sm text-muted-foreground mx-4 whitespace-nowrap">
                {t("signin.continue_with")}
              </p>
              <Separator className="w-[35%]" />
            </div>
            <div className="w-full grid grid-auto-fit-sm gap-4 place-content-center mt-5">
              <Button
                type="button"
                className="rounded-xl p-4"
                disabled={isLoading}
                onClick={async () =>
                  await handleSigninProviders(AuthProviders.Google)
                }
              >
                <GoogleIcon className="mx-2" />
                {t("signin.google_auth")}
              </Button>
            </div>
            <div className="flex justify-center items-center gap-2">
              <p className="text-sm">{t("signin.not_registered")}</p>
              <Link
                href="/signup"
                className="text-sm text-secondary-action underline"
              >
                {t("signin.create_account")}
              </Link>
            </div>
          </section>
        </form>
      </Form>
    </section>
  );
};

export default SignInForm;

/* DISABLE RESET PASSWORD FOR NOW */
/* 
            <div className="flex justify-end">
            <Link
              href="/forgot"
              className="text-sm text-rose-600 hover:underline dark:text-white"
            >
              {t("signin.forgot_password")}
            </Link>
          </div>
          */
