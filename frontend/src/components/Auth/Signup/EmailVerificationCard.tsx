/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPSlot,
  InputOTPGroup,
} from "@/components/ui/input-otp";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNextToast } from "@/hooks/toasts/useNextToast";
import { CheckCircle, Loader, XCircle, Send } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { EmailVerificationFormState } from "@/types/auth/auth.types";
import { createEmailVerificationSchema } from "@/schemas/auth.schema";
import {
  verifyEmailVerificationCodeAction,
  verifyEmailVerificationTokenAction,
} from "@/app/actions/auth.actions";

const EmailVerificationCard = () => {
  const toast = useNextToast();
  const t = useTranslations("auth");
  const searchParams = useSearchParams();

  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error" | null>(
    "loading"
  );
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  const form = useForm<EmailVerificationFormState>({
    resolver: zodResolver(createEmailVerificationSchema(t)),
    defaultValues: {
      pin: "",
    },
  });

  // Get the token from the search params
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) setStatus("error");
    setToken(token);
  }, [searchParams]);

  // Verify the email verification token
  useEffect(() => {
    if (!token) return;

    const validateToken = async () => {
      const response = await verifyEmailVerificationTokenAction(token);
      if (response.success) {
        setStatus("success");
      } else {
        setStatus("error");
        toast.error(t("messages.errors.token_verification"));
      }
    };

    validateToken();
  }, [token]);

  // Allow resend the email verification code after 5 minutes
  useEffect(() => {
    if (isResendDisabled) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer); // Cleanup on unmount
    }
  }, [isResendDisabled]);

  const onSubmit = useCallback(
    async (data: EmailVerificationFormState) => {
      try {
        const { pin } = data;

        if (!token) throw new Error("Token is required");

        const response = await verifyEmailVerificationCodeAction(pin, token);

        if (response.success) {
          toast.success(t("messages.success.email_verification_success"));
        } else {
          switch (response.message) {
            case "invalid_verification_token":
              toast.error(t("messages.errors.invalid_verification_token"));
              break;
            default:
              toast.error(t("messages.errors.code_verification"));
          }
        }
      } catch (error) {
        console.error(error);
        toast.error(t("messages.errors.code_verification"));
      }
    },
    [toast, t, token]
  );

  const handleResendEmail = () => {
    // TODO: Logic to resend the email
    setIsResendDisabled(true);
    setTimeLeft(300);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (status === "loading") {
    return (
      <section className="w-full max-w-xl mx-auto p-8 bg-card backdrop-blur-sm bg-opacity-100 border border-border rounded-xl shadow-lg">
        <div className="flex justify-center items-center h-80">
          <Loader className="h-12 w-12 text-primary animate-spin" />
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="w-full max-w-xl mx-auto p-8 bg-card backdrop-blur-sm bg-opacity-100 border border-border rounded-xl shadow-lg">
        <div className="flex flex-col items-center text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-2xl font-semibold text-foreground">
            {t("email_verification.error")}
          </h2>
          <p className="text-muted-foreground">
            {t("email_verification.error_description")}
          </p>
          <Button disabled={isResendDisabled} onClick={handleResendEmail}>
            {isResendDisabled
              ? t("email_verification.resend_email_time_remaining", {
                  time_remaining: formatTime(timeLeft),
                })
              : t("email_verification.resend_email")}
          </Button>
          <span className="text-muted-foreground text-sm">
            {t("email_verification.error_caption")}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-xl mx-auto p-8 bg-card backdrop-blur-sm bg-opacity-100 border border-border rounded-xl shadow-lg">
      <div className="flex flex-col items-center text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h2 className="text-2xl font-semibold text-foreground">
          {t("email_verification.title")}
        </h2>
        <p className="text-muted-foreground">
          {t("email_verification.description")}
        </p>

        <div className="w-full space-y-24">
          <Form {...form}>
            <div className="w-full">
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center my-2">
                    <FormLabel>
                      {t("email_verification.verification_code")}
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center ml-10 gap-2">
                        <InputOTP
                          {...field}
                          maxLength={6}
                          pattern={REGEXP_ONLY_DIGITS}
                          onBlur={() => {
                            if (field.value?.length === 6)
                              form.handleSubmit(onSubmit)();
                          }}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => form.handleSubmit(onSubmit)()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription className="text-center">
                      {t("email_verification.enter_code")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </div>

        <Button disabled={isResendDisabled} onClick={handleResendEmail}>
          {isResendDisabled
            ? t("email_verification.resend_email_time_remaining", {
                time_remaining: formatTime(timeLeft),
              })
            : t("email_verification.resend_email")}
        </Button>
      </div>
    </section>
  );
};

export default EmailVerificationCard;
