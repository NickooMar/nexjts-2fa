/**
 * A property contact: a person attached to one or more properties. The shared
 * shape behind both renters (`PropertyTenant`) and owners (`PropertyOwner`).
 * Stored in the organization's own database — unrelated to the "tenant"
 * (= organization) of the multi-tenancy model.
 */
export interface PropertyContact {
  _id: string;
  uuid: string;
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
  notes?: string;
  /** Properties this contact is currently linked to. */
  propertyIds: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyContactInput {
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
  notes?: string;
}

export type UpdatePropertyContactInput = Partial<CreatePropertyContactInput>;
