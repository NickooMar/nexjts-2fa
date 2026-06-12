"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { showToast } from "nextjs-toast-notify";
import { CloudUpload, ImagePlus, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  IMAGE_ACCEPT,
  DOCUMENT_ACCEPT,
  partitionFiles,
  formatBytes,
  IMAGE_MAX_SIZE_BYTES,
  DOCUMENT_MAX_SIZE_BYTES,
} from "./media.helpers";

interface MediaDropzoneProps {
  kind: "image" | "document";
  /** How many more files the owner can accept (enforced client-side too). */
  remainingSlots: number;
  disabled?: boolean;
  busy?: boolean;
  compact?: boolean;
  onFiles: (files: File[]) => void;
}

/**
 * Drag-and-drop + click-to-browse file target. Validates type/size/count
 * client-side (mirroring backend rules) and surfaces rejections as toasts;
 * accepted files are handed to the caller, which owns the actual upload.
 */
export function MediaDropzone({
  kind,
  remainingSlots,
  disabled,
  busy,
  compact,
  onFiles,
}: MediaDropzoneProps) {
  const t = useTranslations("properties.media");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      if (disabled || busy) return;
      const { accepted, rejected } = partitionFiles(
        Array.from(incoming),
        kind,
        remainingSlots
      );

      if (rejected.length > 0) {
        const reasons = new Set(rejected.map((entry) => entry.reason));
        const description = reasons.has("size")
          ? t("rejected_size", {
              limit: formatBytes(
                kind === "image"
                  ? IMAGE_MAX_SIZE_BYTES
                  : DOCUMENT_MAX_SIZE_BYTES
              ),
            })
          : reasons.has("count")
            ? t("rejected_count")
            : t("rejected_type");
        showToast.error(
          `${t("rejected_title", { count: rejected.length })} — ${description}`,
          { duration: 4000, position: "top-right" }
        );
      }
      if (accepted.length > 0) onFiles(accepted);
    },
    [disabled, busy, kind, remainingSlots, onFiles, t]
  );

  const Icon = kind === "image" ? ImagePlus : FileUp;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={t(kind === "image" ? "drop_images" : "drop_documents")}
      onClick={() => !disabled && !busy && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setIsDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-center transition-colors",
        compact ? "p-4" : "p-8",
        isDragging && "border-primary bg-primary/5",
        (disabled || busy) && "cursor-not-allowed opacity-60",
        !disabled && !busy && "hover:border-primary/50 hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={kind === "image" ? IMAGE_ACCEPT : DOCUMENT_ACCEPT}
        onChange={(event) => {
          if (event.target.files) handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10",
          compact ? "size-9" : "size-12"
        )}
      >
        {isDragging ? (
          <CloudUpload className={compact ? "size-4" : "size-6"} />
        ) : (
          <Icon className={compact ? "size-4" : "size-6"} />
        )}
      </div>
      <div className="space-y-0.5">
        <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
          {t(kind === "image" ? "drop_images" : "drop_documents")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t(kind === "image" ? "images_hint" : "documents_hint", {
            size: formatBytes(
              kind === "image" ? IMAGE_MAX_SIZE_BYTES : DOCUMENT_MAX_SIZE_BYTES
            ),
          })}
        </p>
      </div>
    </div>
  );
}
