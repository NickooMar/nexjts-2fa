import { useTranslations } from "next-intl";
import Spinner from "@/components/ui/spinner";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "../Inputs/PasswordInput";
import { FormField, FormItem, FormMessage } from "../../ui/form";

type PasswordStepProps = {
  form: UseFormReturn<
    {
      email: string;
      password: string;
    },
    unknown,
    {
      email: string;
      password: string;
    }
  >;
};

export const PasswordStep = ({ form }: PasswordStepProps) => {
  const t = useTranslations("auth");

  return (
    <>
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
      <Button
        type="submit"
        className="w-full rounded-xl mt-4 p-4"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? <Spinner /> : t("signin.login")}
      </Button>
    </>
  );
};
