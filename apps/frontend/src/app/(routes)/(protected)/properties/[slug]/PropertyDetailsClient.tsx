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
  Camera,
  DoorOpen,
  FileText,
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
import { PropertyGallery } from "@/components/Property/media/PropertyGallery";
import { PropertyDocuments } from "@/components/Property/media/PropertyDocuments";
import { ManagePhotosDialog } from "@/components/Property/media/ManagePhotosDialog";
import { PropertyOwnersSection } from "@/components/Property/contacts/PropertyOwnersSection";

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
  const [photosOpen, setPhotosOpen] = useState(false);

  // Server-rendered property seeds the cache; media + edit mutations patch it
  // through the query client, so this re-renders with fresh data.
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
    router.replace("/properties");
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
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-2">
          <Link href="/properties">
            <ArrowLeft className="size-4" />
            {t("details.back")}
          </Link>
        </Button>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" />
              {t("details.edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              {t("details.delete")}
            </Button>
          </div>
        )}
      </div>

      {/* Hero gallery */}
      <PropertyGallery
        images={property.images ?? []}
        propertyName={property.name}
        actions={
          canManage ? (
            <Button
              size="sm"
              variant="secondary"
              className="gap-2 shadow-md"
              onClick={() => setPhotosOpen(true)}
            >
              <Camera className="size-4" />
              {t("media.manage_action")}
            </Button>
          ) : undefined
        }
      />

      {/* Title block */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {property.name}
          </h1>
          <Badge variant="secondary" className="capitalize">
            {t(`types.${property.type}`)}
          </Badge>
        </div>
        {location && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground sm:text-base">
            <MapPin className="size-4 shrink-0" />
            {location}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <DoorOpen className="size-3.5" />
            {t("list.units", { count: property.units })}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {t("details.created_at", { date: formatDate(property.createdAt) })}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {t("details.updated_at", { date: formatDate(property.updatedAt) })}
          </span>
        </div>
      </header>

      <Separator />

      {/* Content: main column + sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {property.description && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {t("details.about_title")}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {property.description}
              </p>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("details.info_title")}
            </h2>
            <Card>
              <CardContent className="pt-6">
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
              </CardContent>
            </Card>
          </section>

          {/* Documents */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">
                {t("media.documents_title")}
              </h2>
            </div>
            <PropertyDocuments property={property} canManage={canManage} />
          </section>

          {/* Owners */}
          <PropertyOwnersSection
            propertyIdOrSlug={property.slug ?? property._id}
            canManage={canManage}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
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

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("details.modules_title")}
            </h2>
            {futureModules.map(({ key, icon: Icon, stat }) => (
              <Card key={key} className="border-dashed">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {t(`details.modules.${key}`)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {stat ?? t(`details.modules.${key}_description`)}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {t("details.coming_soon")}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </aside>
      </div>

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
      <ManagePhotosDialog
        open={photosOpen}
        property={property}
        onOpenChange={setPhotosOpen}
      />
    </div>
  );
};

export default PropertyDetailsClient;
