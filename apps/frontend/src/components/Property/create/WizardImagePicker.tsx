"use client";

import { Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MediaDropzone } from "@/components/Property/media/MediaDropzone";
import { formatBytes } from "@/components/Property/media/media.helpers";
import { ImageDraft } from "./wizard.helpers";

interface WizardImagePickerProps {
  images: ImageDraft[];
  /** Draft id of the chosen cover (defaults to the first image). */
  coverId: string | null;
  maxImages: number;
  disabled?: boolean;
  /** Cover selection only applies to the property gallery, not contracts. */
  withCover?: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onSetCover: (id: string) => void;
}

/**
 * Local (pre-upload) gallery picker: drop/browse images, preview them, pick
 * the cover and drop mistakes — everything stays in memory until the wizard
 * submits. Previews use object URLs, hence plain <img> tags.
 */
export function WizardImagePicker({
  images,
  coverId,
  maxImages,
  disabled,
  withCover = true,
  onAdd,
  onRemove,
  onSetCover,
}: WizardImagePickerProps) {
  const t = useTranslations("properties.new.images");
  const effectiveCoverId = withCover
    ? (coverId ?? images[0]?.id ?? null)
    : null;

  return (
    <div className="space-y-3">
      <MediaDropzone
        kind="image"
        compact={images.length > 0}
        remainingSlots={maxImages - images.length}
        disabled={disabled}
        onFiles={onAdd}
      />

      {images.length > 0 && (
        <>
          {withCover && (
            <p className="text-xs text-muted-foreground">{t("cover_hint")}</p>
          )}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => {
              const isCover = image.id === effectiveCoverId;
              return (
                <li
                  key={image.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border bg-muted/30",
                    isCover && "ring-2 ring-primary"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.previewUrl}
                    alt={image.file.name}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {isCover && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      <Star className="size-3 fill-current" />
                      {t("cover_badge")}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <span className="truncate text-[10px] text-white">
                      {formatBytes(image.file.size)}
                    </span>
                    <div className="flex gap-1">
                      {withCover && !isCover && (
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          disabled={disabled}
                          aria-label={t("set_cover")}
                          title={t("set_cover")}
                          className="size-7"
                          onClick={() => onSetCover(image.id)}
                        >
                          <Star className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        disabled={disabled}
                        aria-label={t("remove")}
                        title={t("remove")}
                        className="size-7"
                        onClick={() => onRemove(image.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
