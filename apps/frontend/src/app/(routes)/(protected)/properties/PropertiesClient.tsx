"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Building2,
  ListFilter,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states/error-state";
import { EmptyState } from "@/components/ui/states/empty-state";
import {
  Property,
  PropertyType,
  PROPERTY_TYPES,
} from "@/types/property/property.types";
import { useProperties } from "@/hooks/queries/use-properties";
import {
  PropertyCard,
  PropertyCardSkeleton,
} from "@/components/Property/PropertyCard";
import { EditPropertyDialog } from "@/components/Property/EditPropertyDialog";
import { DeletePropertyDialog } from "@/components/Property/DeletePropertyDialog";

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
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<PropertyType[]>([]);
  // Quick actions from the cards share one dialog instance per action.
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const { data, isPending, isError, isFetching, refetch } = useProperties({
    initialData: initialProperties,
  });
  const properties = useMemo(() => data ?? [], [data]);

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
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("list.title")}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {organizationName
              ? t("list.description_org", { organization: organizationName })
              : t("list.description")}
          </p>
        </div>
        {canManage && (
          <Button
            size="lg"
            onClick={() => router.push("/properties/new")}
            className="gap-2 shadow-sm"
          >
            <Plus className="size-4" />
            {t("list.create_action")}
          </Button>
        )}
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            className="h-10 rounded-xl pl-9"
            placeholder={t("list.search_placeholder")}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 rounded-xl">
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
            className="size-10 rounded-xl"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Result count */}
      {!isPending && properties.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {t("list.results_count", { count: filtered.length })}
        </p>
      )}

      {isPending ? (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </section>
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
              <Button
                onClick={() => router.push("/properties/new")}
                className="mt-2 gap-2"
              >
                <Plus className="size-4" />
                {t("list.create_action")}
              </Button>
            )
          }
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {t("list.no_results", { query: search })}
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              canManage={canManage}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </section>
      )}

      {editTarget && (
        <EditPropertyDialog
          open
          property={editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          onUpdated={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeletePropertyDialog
          open
          property={deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
};

export default PropertiesClient;
