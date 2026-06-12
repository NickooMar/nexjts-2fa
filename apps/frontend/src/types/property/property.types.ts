export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "commercial",
  "land",
  "other",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type MediaKind = "image" | "document";

/**
 * Media asset as exposed by the gateway: internal storage keys are already
 * resolved into browser-usable URLs (presigned or public). Signed URLs expire,
 * so they are consumed, not cached long-term.
 */
export interface MediaAsset {
  _id: string;
  uuid: string;
  kind: MediaKind;
  originalName: string;
  mimeType: string;
  size: number;
  order: number;
  isCover: boolean;
  url: string;
  createdAt: string;
}

export interface Property {
  _id: string;
  uuid: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  postalCode?: string;
  type: PropertyType;
  units: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  /** Present on list and detail payloads (null when no images uploaded). */
  coverImage?: MediaAsset | null;
  /** Present on detail payloads only. */
  images?: MediaAsset[];
  /** Present on detail payloads only. */
  documents?: MediaAsset[];
}

export interface CreatePropertyInput {
  name: string;
  address: string;
  description?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  postalCode?: string;
  type?: PropertyType;
  units?: number;
}

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

export interface PropertyLimitErrorDetails {
  statusCode: number;
  message: string;
  code: "PROPERTY_LIMIT_EXCEEDED" | "PLAN_LIMIT_REACHED";
  limitKey: string;
  limit?: number;
  current?: number;
  currentPlan?: string;
  currentPlanName?: string;
  upgradeAvailable?: boolean;
}
