"use client";

/* eslint-disable @next/next/no-img-element -- presigned URLs; see
   PropertyPhotosManager for rationale. */

import {
  X,
  Expand,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MediaAsset } from "@/types/property/property.types";

interface PropertyGalleryProps {
  images: MediaAsset[];
  propertyName: string;
  /** Rendered top-right over the hero (e.g. a "Manage photos" button). */
  actions?: React.ReactNode;
}

/**
 * Airbnb-style hero gallery: a large landscape cover with a thumbnail rail,
 * arrow navigation, and a fullscreen viewer with keyboard support. Renders a
 * tasteful placeholder when the property has no photos yet.
 */
export function PropertyGallery({
  images,
  propertyName,
  actions,
}: PropertyGalleryProps) {
  const t = useTranslations("properties.media");
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const count = images.length;
  // Clamp when images are deleted out from under the current index.
  const index = Math.min(activeIndex, Math.max(0, count - 1));
  const active = images[index];

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setActiveIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
      if (event.key === "ArrowLeft") goTo(index - 1);
      if (event.key === "ArrowRight") goTo(index + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [fullscreen, index, goTo]);

  if (count === 0) {
    return (
      <div className="relative flex aspect-[21/9] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 sm:aspect-[3/1]">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <ImageIcon className="size-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t("no_photos_yet")}</p>
        {actions && <div className="absolute right-4 top-4">{actions}</div>}
      </div>
    );
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl bg-muted">
        {/* Hero */}
        <button
          type="button"
          aria-label={t("open_fullscreen")}
          onClick={() => setFullscreen(true)}
          className="block w-full focus-visible:outline-none"
        >
          <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
            <img
              src={active.url}
              alt={`${propertyName} — ${index + 1}/${count}`}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
          </div>
        </button>

        {/* Navigation arrows */}
        {count > 1 && (
          <>
            <Button
              size="icon"
              variant="secondary"
              aria-label={t("previous_photo")}
              onClick={() => goTo(index - 1)}
              className="absolute left-3 top-1/2 size-9 -translate-y-1/2 rounded-full opacity-0 shadow-md transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              aria-label={t("next_photo")}
              onClick={() => goTo(index + 1)}
              className="absolute right-3 top-1/2 size-9 -translate-y-1/2 rounded-full opacity-0 shadow-md transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronRight className="size-5" />
            </Button>
          </>
        )}

        {/* Counter + fullscreen + custom actions */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            <LayoutGrid className="mr-1 inline size-3" />
            {index + 1} / {count}
          </span>
          <Button
            size="icon"
            variant="secondary"
            aria-label={t("open_fullscreen")}
            onClick={() => setFullscreen(true)}
            className="size-8 rounded-full shadow-md"
          >
            <Expand className="size-4" />
          </Button>
        </div>
        {actions && <div className="absolute right-3 top-3">{actions}</div>}
      </div>

      {/* Thumbnail rail */}
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, thumbIndex) => (
            <button
              key={image._id}
              type="button"
              aria-label={`${propertyName} ${thumbIndex + 1}`}
              aria-current={thumbIndex === index}
              onClick={() => setActiveIndex(thumbIndex)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                thumbIndex === index
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={image.url}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen viewer */}
      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={propertyName}
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          onClick={() => setFullscreen(false)}
        >
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-white/80">
              {index + 1} / {count}
            </span>
            <Button
              size="icon"
              variant="ghost"
              aria-label={t("close_fullscreen")}
              onClick={() => setFullscreen(false)}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </Button>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center px-4 pb-4"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={active.url}
              alt={`${propertyName} — ${index + 1}/${count}`}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
            {count > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("previous_photo")}
                  onClick={() => goTo(index - 1)}
                  className="absolute left-4 top-1/2 size-11 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <ChevronLeft className="size-6" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("next_photo")}
                  onClick={() => goTo(index + 1)}
                  className="absolute right-4 top-1/2 size-11 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <ChevronRight className="size-6" />
                </Button>
              </>
            )}
          </div>

          {count > 1 && (
            <div
              className="flex justify-center gap-2 overflow-x-auto p-4"
              onClick={(event) => event.stopPropagation()}
            >
              {images.map((image, thumbIndex) => (
                <button
                  key={image._id}
                  type="button"
                  onClick={() => setActiveIndex(thumbIndex)}
                  className={cn(
                    "h-12 w-16 shrink-0 overflow-hidden rounded border-2 transition-opacity",
                    thumbIndex === index
                      ? "border-white"
                      : "border-transparent opacity-50 hover:opacity-90"
                  )}
                >
                  <img
                    src={image.url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
