"use client";

import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "../ui/form";
import { Input } from "../ui/input";
import { Link } from "@/i18n/routing";
import { Button } from "../ui/button";
import { Loader } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/useToast";
import { signUpSchema } from "@/schemas/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordInput } from "./Inputs/PasswordInput";
import { SubmitHandler, useForm } from "react-hook-form";
import { signUpAction } from "@/app/actions/auth.actions";
import { SignUpFormState } from "@/types/auth/auth.types";
import { DotBackground } from "../Aceternity/DotBackground";

const SignUpForm: React.FC = () => {
  const t = useTranslations("signup");
  const { error: errorToast } = useToast();

  const form = useForm<SignUpFormState>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      organizationName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit: SubmitHandler<SignUpFormState> = async (
    values: SignUpFormState
  ) => {
    try {
      const result = await signUpAction(values);

      console.log(result);
    } catch (error) {
      console.error(error);
      errorToast(t("messages.errors.invalid_data"));
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <DotBackground>
        <section className="w-full max-w-xl mx-auto p-4 sm:p-6 md:p-8 z-0 bg-card border border-border rounded-xl shadow">
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
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("organization.title")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder={t("organization.placeholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("first_name.title")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder={t("first_name.placeholder")}
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
                        <FormLabel>{t("last_name.title")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder={t("last_name.placeholder")}
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
                      <FormLabel>{t("email.title")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder={t("email.placeholder")}
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
                      <FormLabel>{t("password.title")}</FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          id="password"
                          placeholder={t("password.title")}
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
                      <FormLabel>{t("confirm_password.title")}</FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          id="confirmPassword"
                          placeholder={t("confirm_password.title")}
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
                  {form.formState.isSubmitting ? <Loader /> : t("create")}
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
          </Form>
        </section>
      </DotBackground>
    </div>
  );
};

export default SignUpForm;
