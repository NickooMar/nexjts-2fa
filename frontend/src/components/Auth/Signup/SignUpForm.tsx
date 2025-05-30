"use client";

import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "../../ui/form";
import Link from "next/link";
import { Loader } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PhoneInput } from "../../ui/phone-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordInput } from "../Inputs/PasswordInput";
import { SubmitHandler, useForm } from "react-hook-form";
import { SignUpFormState } from "@/types/auth/auth.types";
import { signUpAction } from "@/app/actions/auth.actions";
import { useNextToast } from "@/hooks/toasts/useNextToast";
import { createSignUpSchema } from "@/schemas/auth.schema";

const SignUpForm = () => {
  const router = useRouter();
  const toast = useNextToast();
  const t = useTranslations("auth");

  const signUpSchema = createSignUpSchema(t);

  const form = useForm<SignUpFormState>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      lastName: "",
      password: "",
      firstName: "",
      phoneNumber: "",
      confirmPassword: "",
    },
  });

  const onSubmit: SubmitHandler<SignUpFormState> = async (
    values: SignUpFormState
  ) => {
    try {
      const response = await signUpAction(values);

      if (!response.success) {
        switch (response.error) {
          case "user_already_exists": {
            form.setError("email", {
              message: t("messages.errors.email_already_exists"),
            });
            return toast.error(t("messages.errors.user_already_exists"));
          }
          case "network_error":
            return toast.error(t("messages.errors.network_error"));
          default:
            return toast.error(t("messages.errors.invalid_credentials"));
        }
      }

      if (response.data?.success) {
        toast.success(t("messages.success.signup_success"));
        router.push(`/verify-email?token=${response.data?.verificationToken}`);
      } else {
        toast.error(t("messages.errors.request_error"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("messages.errors.request_error"));
    }
  };

  return (
    <section className="w-full max-w-xl mx-auto p-8 bg-card backdrop-blur-sm bg-opacity-100 border border-border rounded-xl shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex flex-col justify-center items-center space-y-2 gap-2">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {t("signup.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("signup.description")}
            </p>
          </div>
          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signup.first_name.title")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder={t("signup.first_name.placeholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("signup.last_name.title")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder={t("signup.last_name.placeholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("signup.email.title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={t("signup.email.placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("signup.phone_number.title")}</FormLabel>
                  <FormControl>
                    <PhoneInput
                      {...field}
                      placeholder={t("signup.phone_number.placeholder")}
                      defaultCountry="AR"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("signup.password.title")}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      id="password"
                      placeholder={t("signup.password.title")}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("signup.confirm_password.title")}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      id="confirmPassword"
                      placeholder={t("signup.confirm_password.title")}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full rounded-xl mt-4 p-4"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Loader /> : t("signup.create")}
            </Button>

            <div className="flex justify-center items-center gap-2">
              <p className="text-sm">{t("signup.already_have_account")}</p>
              <Link
                href="/signin"
                className="text-sm text-secondary-action underline"
              >
                {t("signin.title")}
              </Link>
            </div>
          </section>
        </form>
      </Form>
    </section>
  );
};

export default SignUpForm;
