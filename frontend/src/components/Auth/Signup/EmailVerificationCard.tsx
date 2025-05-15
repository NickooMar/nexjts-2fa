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
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNextToast } from "@/hooks/toasts/useNextToast";
import React, { useState, useEffect, useCallback } from "react";
import { EmailVerificationFormState } from "@/types/auth/auth.types";
import { createEmailVerificationSchema } from "@/schemas/auth.schema";

const EmailVerificationCard = () => {
  const toast = useNextToast();
  const t = useTranslations("auth");

  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  const form = useForm<EmailVerificationFormState>({
    resolver: zodResolver(createEmailVerificationSchema(t)),
    defaultValues: {
      pin: "",
    },
  });

  const onSubmit = useCallback(
    async (data: EmailVerificationFormState) => {
      // TODO: Logic to verify the email via verification code
      console.log({ data });
      toast.success(t("messages.success.email_verification_success"));
    },
    [toast, t]
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
