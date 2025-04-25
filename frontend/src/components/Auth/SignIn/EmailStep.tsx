import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@mui/icons-material/Google";
import { Separator } from "@/components/ui/separator";
import { AuthProviders } from "@/types/auth/auth.types";
import { FormField, FormItem, FormMessage } from "../../ui/form";

type EmailStepProps = {
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
  onNextStep: () => Promise<void>;
  onProviderSignin: (provider: AuthProviders) => Promise<void>;
};

export const EmailStep = ({
  form,
  onNextStep,
  onProviderSignin,
}: EmailStepProps) => {
  const t = useTranslations("auth");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const nextStep = useCallback(async () => {
    setIsLoading(true);
    await onNextStep();
    setIsLoading(false);
  }, [onNextStep]);

  const signinWithProvider = useCallback(
    async (provider: AuthProviders) => {
      setIsLoading(true);
      await onProviderSignin(provider);
      setIsLoading(false);
    },
    [onProviderSignin]
  );

  return (
    <>
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
              placeholder={t("signin.email.placeholder")}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <Button
        type="button"
        className="w-full rounded-xl mt-4 p-4"
        disabled={isLoading}
        onClick={nextStep}
      >
        {isLoading ? <Spinner /> : t("signin.next")}
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
          onClick={async () => await signinWithProvider(AuthProviders.Google)}
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
    </>
  );
};
