"use client";

/* eslint-disable @next/next/no-img-element -- media URLs are presigned and
   short-lived; the Next image optimizer cannot fetch them from inside the
   container network, so plain <img> is intentional here. */

import {
  Star,
  Trash2,
  Loader2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Property } from "@/types/property/property.types";
import {
  useSetPropertyCover,
  useDeletePropertyMedia,
  useUploadPropertyImages,
  useReorderPropertyImages,
} from "@/hooks/mutations/use-property-media-mutations";
import { MediaDropzone } from "./MediaDropzone";
import { IMAGE_MAX_PER_PROPERTY } from "./media.helpers";

interface PropertyPhotosManagerProps {
  property: Property;
}

interface PendingUpload {
  id: string;
  name: string;
  previewUrl: string;
}

/**
 * Photo management surface: drag-and-drop uploads with local previews while
 * in flight, drag (or arrow) reordering, cover selection and deletion.
 * Mutations patch the React Query cache, so the parent gallery re-renders
 * with fresh data automatically.
 */
export function PropertyPhotosManager({ property }: PropertyPhotosManagerProps) {
  const t = useTranslations("properties.media");
  const idOrSlug = property.slug ?? property._id;
  const images = useMemo(() => property.images ?? [], [property.images]);

  const [pending, setPending] = useState<PendingUpload[]>([]);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const uploadImages = useUploadPropertyImages(idOrSlug, {
    successMessage: t("upload_success"),
    errorMessage: t("upload_error"),
    errorMessages: {
      media_limit_reached: t("limit_reached"),
      unsupported_file_type: t("rejected_type"),
      file_too_large: t("rejected_size_generic"),
    },
  });
  const deleteMedia = useDeletePropertyMedia(idOrSlug, {
    successMessage: t("delete_success"),
    errorMessage: t("delete_error"),
  });
  const setCover = useSetPropertyCover(idOrSlug, {
    successMessage: t("cover_success"),
    errorMessage: t("cover_error"),
  });
  const reorder = useReorderPropertyImages(idOrSlug, {
    errorMessage: t("reorder_error"),
  });

  const startUpload = (files: File[]) => {
    const previews: PendingUpload[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));
    setPending((current) => [...current, ...previews]);

    uploadImages.mutate(files, {
      onSettled: () => {
        setPending((current) => {
          const ids = new Set(previews.map((preview) => preview.id));
          current
            .filter((entry) => ids.has(entry.id))
            .forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
          return current.filter((entry) => !ids.has(entry.id));
        });
      },
    });
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const ids = images.map((image) => image._id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    reorder.mutate(ids);
  };

  const remainingSlots = Math.max(
    0,
    IMAGE_MAX_PER_PROPERTY - images.length - pending.length
  );

  return (
    <div className="space-y-4">
      <MediaDropzone
        kind="image"
        remainingSlots={remainingSlots}
        busy={uploadImages.isPending}
        disabled={remainingSlots === 0}
        onFiles={startUpload}
      />

      {images.length === 0 && pending.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          {t("no_photos")}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image._id}
              draggable
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverIndex(index);
              }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOverIndex(null);
                if (dragIndex.current !== null) {
                  moveImage(dragIndex.current, index);
                  dragIndex.current = null;
                }
              }}
              onDragEnd={() => {
                dragIndex.current = null;
                setDragOverIndex(null);
              }}
              className={cn(
                "group relative aspect-[4/3] cursor-grab overflow-hidden rounded-lg border border-border bg-muted active:cursor-grabbing",
                dragOverIndex === index && "ring-2 ring-primary"
              )}
            >
              <img
                src={image.url}
                alt={image.originalName}
                className="size-full object-cover"
                loading="lazy"
                draggable={false}
              />

              {image.isCover && (
                <Badge className="absolute left-2 top-2 gap-1 shadow">
                  <Star className="size-3 fill-current" />
                  {t("cover_badge")}
                </Badge>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-7"
                    aria-label={t("move_left")}
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => moveImage(index, index - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-7"
                    aria-label={t("move_right")}
                    disabled={index === images.length - 1 || reorder.isPending}
                    onClick={() => moveImage(index, index + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  {!image.isCover && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-7"
                      aria-label={t("set_cover")}
                      title={t("set_cover")}
                      disabled={setCover.isPending}
                      onClick={() => setCover.mutate(image._id)}
                    >
                      <Star className="size-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="size-7"
                    aria-label={t("delete_photo")}
                    title={t("delete_photo")}
                    disabled={deleteMedia.isPending}
                    onClick={() => deleteMedia.mutate(image._id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="absolute right-2 top-2 rounded bg-black/40 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="size-4 text-white" />
              </div>
            </li>
          ))}

          {/* In-flight uploads: local previews with a spinner overlay. */}
          {pending.map((entry) => (
            <li
              key={entry.id}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted"
            >
              <img
                src={entry.previewUrl}
                alt={entry.name}
                className="size-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                <Loader2 className="size-6 animate-spin" />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {t("photos_count", {
          count: images.length,
          max: IMAGE_MAX_PER_PROPERTY,
        })}
      </p>
    </div>
  );
}
