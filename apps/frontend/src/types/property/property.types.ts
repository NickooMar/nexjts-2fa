export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "commercial",
  "land",
  "other",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

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
  country?: string;
  postalCode?: string;
  type: PropertyType;
  units: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyInput {
  name: string;
  address: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  type?: PropertyType;
  units?: number;
}

export type UpdatePropertyInput = Partial<CreatePropertyInput>;
