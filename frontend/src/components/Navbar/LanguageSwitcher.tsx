"use client";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useTransition } from "react";
import { Button } from "../ui/button";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

interface Language {
  id: string;
  label: string;
  icon: React.ElementType;
}

const LanguageSwitcher = () => {
  const t = useTranslations("general");
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const languages: Language[] = [
    { id: "es", label: t("languages.spanish"), icon: Languages },
    { id: "en", label: t("languages.english"), icon: Languages },
  ];

  const handleLanguageChange = (value: string) => {
    const nextLocale = value as (typeof routing.locales)[number];

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const LanguageGroup = ({ languages }: { languages: Language[] }) => (
    <DropdownMenuGroup>
      {languages.map(({ id, label, icon: Icon }) => (
        <DropdownMenuItem
          key={id}
          onClick={() => handleLanguageChange(id)}
          className={locale === id ? "my-2 bg-accent" : "my-2"}
          disabled={isPending}
        >
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("languages.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator className="mb-2" />
        <LanguageGroup languages={languages} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
