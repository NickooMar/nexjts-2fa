"use client";

import { FileText, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  formatBytes,
  documentTypeLabel,
} from "@/components/Property/media/media.helpers";
import { FileDraft } from "./wizard.helpers";

interface WizardFileListProps {
  files: FileDraft[];
  disabled?: boolean;
  onRemove: (id: string) => void;
}

/** Compact list of locally selected documents pending upload. */
export function WizardFileList({
  files,
  disabled,
  onRemove,
}: WizardFileListProps) {
  const t = useTranslations("properties.new.files");

  if (files.length === 0) return null;

  return (
    <ul className="space-y-2">
      {files.map((draft) => (
        <li
          key={draft.id}
          className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
        >
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{draft.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {documentTypeLabel(draft.file.name)} ·{" "}
              {formatBytes(draft.file.size)}
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled}
            aria-label={t("remove")}
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(draft.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
