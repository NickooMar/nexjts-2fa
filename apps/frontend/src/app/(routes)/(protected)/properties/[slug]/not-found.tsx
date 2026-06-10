import Link from "next/link";
import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function PropertyNotFound() {
  const t = await getTranslations("properties");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 p-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <Building2 className="size-7 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold">{t("not_found.title")}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("not_found.description")}
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/properties">{t("not_found.back")}</Link>
      </Button>
    </div>
  );
}
