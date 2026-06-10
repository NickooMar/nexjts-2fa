"use client";

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  MapPin,
  Wrench,
  Pencil,
  Trash2,
  DoorOpen,
  Building2,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Property } from "@/types/property/property.types";
import { useProperty } from "@/hooks/queries/use-properties";
import { EditPropertyDialog } from "@/components/Property/EditPropertyDialog";
import { DeletePropertyDialog } from "@/components/Property/DeletePropertyDialog";

interface PropertyDetailsClientProps {
  property: Property;
  canManage: boolean;
  organization: { name?: string; slug?: string };
}

const PropertyDetailsClient = ({
  property: initialProperty,
  canManage,
  organization,
}: PropertyDetailsClientProps) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("properties");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Server-rendered property seeds the cache; mutations (edit/delete) update
  // it through the query client, so this re-renders with fresh data.
  const { data: property = initialProperty } = useProperty(
    initialProperty.slug ?? initialProperty._id,
    { initialData: initialProperty }
  );

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const onUpdated = (updated: Property) => {
    // Renames regenerate the slug; keep the URL canonical.
    if (updated.slug !== property.slug) {
      router.replace(`/properties/${updated.slug}`);
    }
  };

  const onDeleted = () => {
    router.push("/properties");
  };

  const location = [
    property.address,
    property.city,
    property.state,
    property.postalCode,
    property.country,
  ]
    .filter(Boolean)
    .join(", ");

  const futureModules = [
    {
      key: "units",
      icon: DoorOpen,
      stat: t("details.units_count", { count: property.units }),
    },
    { key: "tenants", icon: Users, stat: undefined },
    { key: "maintenance", icon: Wrench, stat: undefined },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2">
        <Link href="/properties">
          <ArrowLeft className="size-4" />
          {t("details.back")}
        </Link>
      </Button>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Building2 className="size-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {property.name}
              </h1>
              <Badge variant="secondary" className="capitalize">
                {t(`types.${property.type}`)}
              </Badge>
            </div>
            {location && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                {location}
              </p>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" />
              {t("details.edit")}
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              {t("details.delete")}
            </Button>
          </div>
        )}
      </header>

      {property.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("details.about_title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {property.description}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("details.info_title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {(
                [
                  ["address", property.address],
                  ["city", property.city],
                  ["state", property.state],
                  ["postal_code", property.postalCode],
                  ["country", property.country],
                  ["units", String(property.units)],
                ] as const
              )
                .filter(([, value]) => Boolean(value))
                .map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-muted-foreground">
                      {t(`form.${key}.title`)}
                    </dt>
                    <dd className="mt-0.5 font-medium">{value}</dd>
                  </div>
                ))}
            </dl>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-6">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {t("details.created_at", {
                  date: formatDate(property.createdAt),
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {t("details.updated_at", {
                  date: formatDate(property.updatedAt),
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("details.organization_title")}
            </CardTitle>
            <CardDescription>
              {t("details.organization_description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">
                {t("details.organization_name")}
              </p>
              <p className="mt-0.5 font-medium">
                {organization.name ?? organization.slug ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">
                {t("details.property_id")}
              </p>
              <p className="mt-0.5 break-all font-mono text-xs">
                {property.uuid}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("details.modules_title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {futureModules.map(({ key, icon: Icon, stat }) => (
            <Card key={key} className="border-dashed">
              <CardContent className="flex flex-col items-start gap-2 p-5">
                <div className="flex w-full items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </div>
                  <Badge variant="outline">{t("details.coming_soon")}</Badge>
                </div>
                <p className="font-medium">{t(`details.modules.${key}`)}</p>
                <p className="text-sm text-muted-foreground">
                  {stat ?? t(`details.modules.${key}_description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <EditPropertyDialog
        open={editOpen}
        property={property}
        onOpenChange={setEditOpen}
        onUpdated={onUpdated}
      />
      <DeletePropertyDialog
        open={deleteOpen}
        property={property}
        onOpenChange={setDeleteOpen}
        onDeleted={onDeleted}
      />
    </div>
  );
};

export default PropertyDetailsClient;
