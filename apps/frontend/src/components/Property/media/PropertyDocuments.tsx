"use client";

import {
  FileText,
  Trash2,
  Loader2,
  Download,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { showToast } from "nextjs-toast-notify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaAsset, Property } from "@/types/property/property.types";
import { getDocumentDownloadUrl } from "@/services/api/property-media.api";
import {
  useDeletePropertyMedia,
  useUploadPropertyDocuments,
} from "@/hooks/mutations/use-property-media-mutations";
import { MediaDropzone } from "./MediaDropzone";
import {
  formatBytes,
  documentTypeLabel,
  DOCUMENT_MAX_PER_REQUEST,
} from "./media.helpers";

interface PropertyDocumentsProps {
  property: Property;
  canManage: boolean;
}

/**
 * Document section: contracts, deeds, spreadsheets… Uploads go through the
 * same storage pipeline as photos; downloads mint a fresh signed URL per
 * click (stored URLs expire) and open in a new tab. Preview uses the inline
 * URL already attached to the asset.
 */
export function PropertyDocuments({
  property,
  canManage,
}: PropertyDocumentsProps) {
  const locale = useLocale();
  const t = useTranslations("properties.media");
  const idOrSlug = property.slug ?? property._id;
  const documents = property.documents ?? [];

  const [pendingNames, setPendingNames] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const uploadDocuments = useUploadPropertyDocuments(idOrSlug, {
    successMessage: t("document_upload_success"),
    errorMessage: t("upload_error"),
    errorMessages: {
      media_limit_reached: t("limit_reached"),
      unsupported_file_type: t("rejected_type"),
      file_too_large: t("rejected_size_generic"),
    },
  });
  const deleteMedia = useDeletePropertyMedia(idOrSlug, {
    successMessage: t("document_delete_success"),
    errorMessage: t("delete_error"),
  });

  const startUpload = (files: File[]) => {
    setPendingNames((current) => [...current, ...files.map((f) => f.name)]);
    uploadDocuments.mutate(files, {
      onSettled: () => {
        const names = new Set(files.map((f) => f.name));
        setPendingNames((current) =>
          current.filter((name) => !names.has(name))
        );
      },
    });
  };

  const download = async (document: MediaAsset) => {
    setDownloadingId(document._id);
    try {
      const url = await getDocumentDownloadUrl({
        idOrSlug,
        mediaId: document._id,
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      showToast.error(t("download_error"), {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-4">
      {canManage && (
        <MediaDropzone
          kind="document"
          compact
          remainingSlots={DOCUMENT_MAX_PER_REQUEST}
          busy={uploadDocuments.isPending}
          onFiles={startUpload}
        />
      )}

      {documents.length === 0 && pendingNames.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t("no_documents")}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {documents.map((document) => (
            <li
              key={document._id}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {document.originalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  <Badge variant="outline" className="mr-2 px-1 py-0 text-[10px]">
                    {documentTypeLabel(document.originalName)}
                  </Badge>
                  {formatBytes(document.size)} · {formatDate(document.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label={t("preview_document")}
                  title={t("preview_document")}
                >
                  <a href={document.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label={t("download_document")}
                  title={t("download_document")}
                  disabled={downloadingId === document._id}
                  onClick={() => download(document)}
                >
                  {downloadingId === document._id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                </Button>
                {canManage && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:text-destructive"
                    aria-label={t("delete_document")}
                    title={t("delete_document")}
                    disabled={deleteMedia.isPending}
                    onClick={() => deleteMedia.mutate(document._id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}

          {pendingNames.map((name, pendingIndex) => (
            <li
              key={`${name}-${pendingIndex}`}
              className="flex items-center gap-3 p-3 opacity-60"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Loader2 className="size-5 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {t("uploading")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
