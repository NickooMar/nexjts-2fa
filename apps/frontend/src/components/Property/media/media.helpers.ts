/**
 * Client-side upload constraints. These mirror the backend rules
 * (apps/backend/libs/storage/file-validation.ts) so users get instant
 * feedback; the backend remains the source of truth and re-validates.
 */

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
export const IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const IMAGE_MAX_PER_REQUEST = 15;
export const IMAGE_MAX_PER_PROPERTY = 30;

export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt";
export const DOCUMENT_MAX_SIZE_BYTES = 25 * 1024 * 1024;
export const DOCUMENT_MAX_PER_REQUEST = 10;

const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
];

export type UploadRejectionReason = "type" | "size" | "count";

export interface FileSelection {
  accepted: File[];
  rejected: Array<{ file: File; reason: UploadRejectionReason }>;
}

/** Split a candidate file list into accepted/rejected for the given kind. */
export function partitionFiles(
  files: File[],
  kind: "image" | "document",
  remainingSlots: number
): FileSelection {
  const accepted: File[] = [];
  const rejected: FileSelection["rejected"] = [];

  for (const file of files) {
    const validType =
      kind === "image"
        ? IMAGE_ACCEPT.split(",").includes(file.type)
        : DOCUMENT_EXTENSIONS.some((extension) =>
            file.name.toLowerCase().endsWith(extension)
          );
    const maxSize =
      kind === "image" ? IMAGE_MAX_SIZE_BYTES : DOCUMENT_MAX_SIZE_BYTES;

    if (!validType) {
      rejected.push({ file, reason: "type" });
    } else if (file.size > maxSize) {
      rejected.push({ file, reason: "size" });
    } else if (accepted.length >= remainingSlots) {
      rejected.push({ file, reason: "count" });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejected };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

/** Best-effort short label for a document's type, derived from its name. */
export function documentTypeLabel(name: string): string {
  const extension = name.split(".").pop()?.toUpperCase();
  return extension && extension.length <= 4 ? extension : "FILE";
}
