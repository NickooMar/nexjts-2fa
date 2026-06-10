"use client";

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MapPin,
  Building2,
  ListFilter,
  DoorOpen,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states/error-state";
import { EmptyState } from "@/components/ui/states/empty-state";
import { CardGridSkeleton } from "@/components/ui/states/loading-state";
import {
  Property,
  PropertyType,
  PROPERTY_TYPES,
} from "@/types/property/property.types";
import { useProperties } from "@/hooks/queries/use-properties";
import { CreatePropertyDialog } from "@/components/Property/CreatePropertyDialog";

interface PropertiesClientProps {
  canManage: boolean;
  organizationName?: string;
  initialProperties?: Property[];
}

const PropertiesClient = ({
  canManage,
  organizationName,
  initialProperties,
}: PropertiesClientProps) => {
  const t = useTranslations("properties");

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [typeFilters, setTypeFilters] = useState<PropertyType[]>([]);

  const { data, isPending, isError, isFetching, refetch } = useProperties({
    initialData: initialProperties,
  });
  const properties = data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return properties.filter((property) => {
      if (typeFilters.length > 0 && !typeFilters.includes(property.type)) {
        return false;
      }
      if (!query) return true;
      return [
        property.name,
        property.address,
        property.city,
        property.state,
        property.country,
        property.postalCode,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [properties, search, typeFilters]);

  const toggleTypeFilter = (type: PropertyType) => {
    setTypeFilters((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("list.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {organizationName
              ? t("list.description_org", { organization: organizationName })
              : t("list.description")}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="size-4" />
            {t("list.create_action")}
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            className="pl-9"
            placeholder={t("list.search_placeholder")}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ListFilter className="size-4" />
              {t("list.filter_type")}
              {typeFilters.length > 0 && (
                <Badge variant="secondary">{typeFilters.length}</Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {PROPERTY_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={typeFilters.includes(type)}
                onCheckedChange={() => toggleTypeFilter(type)}
              >
                {t(`types.${type}`)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label={t("list.refresh")}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isPending ? (
        <CardGridSkeleton />
      ) : isError && data === undefined ? (
        <ErrorState
          title={t("list.error_title")}
          description={t("list.error_description")}
          retryLabel={t("list.retry")}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("list.empty_title")}
          description={t("list.empty_description")}
          action={
            canManage && (
              <Button onClick={() => setCreateOpen(true)} className="mt-2 gap-2">
                <Plus className="size-4" />
                {t("list.create_action")}
              </Button>
            )
          }
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {t("list.no_results", { query: search })}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <Link
              key={property._id}
              href={`/properties/${property.slug ?? property._id}`}
              className="group focus-visible:outline-none"
            >
              <Card className="h-full transition-colors group-hover:border-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="size-5" />
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {t(`types.${property.type}`)}
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-tight">
                    {property.name}
                  </CardTitle>
                  {property.description && (
                    <CardDescription className="line-clamp-2">
                      {property.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0" />
                    <span className="truncate">
                      {[property.address, property.city, property.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <DoorOpen className="size-4 shrink-0" />
                    {t("list.units", { count: property.units })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      )}

      <CreatePropertyDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default PropertiesClient;
