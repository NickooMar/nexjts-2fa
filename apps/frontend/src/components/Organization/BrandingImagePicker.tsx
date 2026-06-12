"use client";

/* eslint-disable @next/next/no-img-element -- local object-URL previews. */

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BrandingImagePickerProps {
  label: string;
  /** Aspect hint for the preview box: logos are square, banners are wide. */
  shape: "square" | "wide";
  value: File | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Lightweight optional image slot used by the create-organization flow
 * (logo + banner). Selection only — the upload happens after the
 * organization exists, since branding endpoints are tenant-scoped.
 */
export function BrandingImagePicker({
  label,
  shape,
  value,
  disabled,
  onChange,
}: BrandingImagePickerProps) {
  const t = useTranslations("auth.create_organization.branding");
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const select = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type) || file.size > MAX_SIZE_BYTES) {
      return; // silently ignore invalid picks; the field is optional
    }
    onChange(file);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={ACCEPT}
        onChange={(event) => {
          select(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {previewUrl ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border border-border",
            shape === "square" ? "size-20" : "h-20 w-full"
          )}
        >
          <img
            src={previewUrl}
            alt={label}
            className="size-full object-cover"
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={t("remove")}
            disabled={disabled}
            onClick={() => onChange(null)}
            className="absolute right-1 top-1 size-6 rounded-full shadow"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            select(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
            shape === "square" ? "size-20" : "h-20 w-full"
          )}
        >
          <ImagePlus className="size-4" />
          {shape === "wide" && t("choose")}
        </button>
      )}
    </div>
  );
}
