import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

/**
 * Upload constraints per media kind. Mime types and extensions are both
 * checked (a spoofed Content-Type alone is not enough to slip an executable
 * through) and filenames never reach the bucket — keys are generated UUIDs.
 */
export const MediaKinds = {
  IMAGE: 'image',
  DOCUMENT: 'document',
} as const;

export type MediaKind = (typeof MediaKinds)[keyof typeof MediaKinds];

interface UploadRules {
  mimeTypes: readonly string[];
  extensions: readonly string[];
  maxSizeBytes: number;
  maxFilesPerRequest: number;
  /** Cap of stored assets of this kind per owner entity. */
  maxFilesPerOwner: number;
}

export const UPLOAD_RULES: Record<MediaKind, UploadRules> = {
  [MediaKinds.IMAGE]: {
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
    ],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'],
    maxSizeBytes: 10 * 1024 * 1024,
    maxFilesPerRequest: 15,
    maxFilesPerOwner: 30,
  },
  [MediaKinds.DOCUMENT]: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
    ],
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'],
    maxSizeBytes: 25 * 1024 * 1024,
    maxFilesPerRequest: 10,
    maxFilesPerOwner: 50,
  },
};

/** The biggest single file any kind allows — used as the Multer hard limit. */
export const MAX_UPLOAD_SIZE_BYTES = Math.max(
  ...Object.values(UPLOAD_RULES).map((rules) => rules.maxSizeBytes),
);

export const MAX_FILES_PER_REQUEST = Math.max(
  ...Object.values(UPLOAD_RULES).map((rules) => rules.maxFilesPerRequest),
);

/**
 * Validate a batch of uploaded files against the rules for `kind`. Throws
 * BadRequestException with machine-readable codes the frontend maps to i18n.
 */
export function validateUploadedFiles(
  files: Express.Multer.File[],
  kind: MediaKind,
  existingCount = 0,
): void {
  const rules = UPLOAD_RULES[kind];

  if (!files || files.length === 0) {
    throw new BadRequestException('no_files_provided');
  }
  if (files.length > rules.maxFilesPerRequest) {
    throw new BadRequestException('too_many_files');
  }
  if (existingCount + files.length > rules.maxFilesPerOwner) {
    throw new BadRequestException('media_limit_reached');
  }

  for (const file of files) {
    if (!rules.mimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('unsupported_file_type');
    }
    const extension = extname(file.originalname ?? '').toLowerCase();
    if (!rules.extensions.includes(extension)) {
      throw new BadRequestException('unsupported_file_type');
    }
    if (file.size > rules.maxSizeBytes) {
      throw new BadRequestException('file_too_large');
    }
    if (file.size === 0) {
      throw new BadRequestException('empty_file');
    }
  }
}

/** Strip path segments / control characters so names are safe to echo back. */
export function sanitizeFilename(name: string): string {
  return (name ?? 'file')
    .replace(/[/\\]/g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f"]/g, '')
    .trim()
    .slice(0, 255);
}
