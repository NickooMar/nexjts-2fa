/**
 * A property tenant: a person renting/occupying a property. Stored in the
 * organization's own database — unrelated to the "tenant" (= organization)
 * of the multi-tenancy model.
 */
export interface PropertyTenant {
  _id: string;
  uuid: string;
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
  notes?: string;
  /** Properties this tenant currently occupies. */
  propertyIds: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyTenantInput {
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
  notes?: string;
}

export type UpdatePropertyTenantInput = Partial<CreatePropertyTenantInput>;
