/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Form } from "../../ui/form";
import { EmailStep } from "./EmailStep";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/useToast";
import { PasswordStep } from "./PasswordStep";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { createSignInSchema } from "@/schemas/auth.schema";
import React, { useCallback, useMemo, useState } from "react";
import { DotBackground } from "../../Aceternity/DotBackground";
import { AuthProviders, SignInFormState } from "@/types/auth/auth.types";
import { signInAction, signInWithProvider } from "@/app/actions/auth.actions";

const SignInForm: React.FC = () => {
  const t = useTranslations("auth");
  const { error: errorToast } = useToast();
  const signInSchema = createSignInSchema(t);

  const [step, setStep] = useState<"email" | "password">("email");

  const form = useForm<SignInFormState>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { trigger, clearErrors } = form;

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
      errorToast(t("signin.messages.errors.invalid_data"));
    }
  };

  const onNextStep = async () => {
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const validEmailStep = await trigger("email");

    // TODO: validate the email in the database

    if (validEmailStep) setStep("password");
  };

  const handleBackStep = useCallback(() => {
    clearErrors();
    setStep("email");
  }, [step, clearErrors]);

  const renderStep = useMemo(() => {
    const mappedSteps = {
      email: (
        <EmailStep
          form={form}
          onNextStep={onNextStep}
          onProviderSignin={handleSigninProviders}
        />
      ),
      password: <PasswordStep form={form} />,
    };
    return mappedSteps[step];
  }, [step]);

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <DotBackground>
        <section className="w-full max-w-md mx-auto p-4 sm:p-6 md:p-8 z-0 bg-card border border-border rounded-xl shadow relative">
          {step === "password" && (
            <div className="absolute top-2 left-2">
              <Button variant="ghost" size="icon" onClick={handleBackStep}>
                <ArrowLeft />
              </Button>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex flex-col justify-center items-center space-y-2 gap-2">
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  {t("signin.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("signin.description")}
                </p>
              </div>
              <section className="space-y-4">{renderStep}</section>
            </form>
          </Form>
        </section>
      </DotBackground>
    </div>
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
