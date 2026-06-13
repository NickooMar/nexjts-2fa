"use client";

/* eslint-disable @next/next/no-img-element -- presigned media URLs are
   short-lived and unreachable from the optimizer container; see media README. */

import {
  Eye,
  MapPin,
  Pencil,
  Trash2,
  DoorOpen,
  Building2,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Property, PropertyType } from "@/types/property/property.types";

interface PropertyCardProps {
  property: Property;
  canManage: boolean;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
}

/** Soft accent per property type so badges scan visually on the grid. */
const TYPE_BADGE_CLASSES: Record<PropertyType, string> = {
  apartment: "bg-sky-500/90 text-white",
  house: "bg-emerald-500/90 text-white",
  commercial: "bg-violet-500/90 text-white",
  land: "bg-amber-500/90 text-white",
  other: "bg-zinc-500/90 text-white",
};

/**
 * Marketplace-style property card: large landscape cover with a hover zoom,
 * type badge over the image, and a quick-actions menu for managers. The whole
 * card navigates to the detail page.
 */
export function PropertyCard({
  property,
  canManage,
  onEdit,
  onDelete,
}: PropertyCardProps) {
  const t = useTranslations("properties");
  const router = useRouter();
  const href = `/properties/${property.slug ?? property._id}`;

  console.log("PropertyCard render", { property });

  const location = [property.address, property.city, property.country]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <Link
        href={href}
        className="absolute inset-0 z-0 focus-visible:outline-none"
        aria-label={property.name}
      />

      {/* Cover */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {property.coverImage ? (
          <img
            src={property.coverImage.url}
            alt={property.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
            <Building2 className="size-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <Badge
          className={cn(
            "absolute left-3 top-3 border-0 capitalize shadow-sm",
            TYPE_BADGE_CLASSES[property.type] ?? TYPE_BADGE_CLASSES.other,
          )}
        >
          {t(`types.${property.type}`)}
        </Badge>

        {/* Quick actions — above the stretched link */}
        <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="size-8 rounded-full shadow-md"
                aria-label={t("list.quick_actions")}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => router.push(href)}>
                <Eye className="mr-2 size-4" />
                {t("list.view_details")}
              </DropdownMenuItem>
              {canManage && (
                <>
                  <DropdownMenuItem onClick={() => onEdit?.(property)}>
                    <Pencil className="mr-2 size-4" />
                    {t("details.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete?.(property)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {t("details.delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className="pointer-events-none z-[1] flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-base font-semibold tracking-tight">
          {property.name}
        </h3>
        {location && (
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}
        {property.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground/80">
            {property.description}
          </p>
        )}
      </div>
    </article>
  );
}

/** Loading placeholder matching the card's layout (image + text rows). */
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
