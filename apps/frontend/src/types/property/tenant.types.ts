/**
 * A property tenant: a person renting/occupying a property. Shares its shape
 * with {@link PropertyContact}.
 */
import {
  PropertyContact,
  CreatePropertyContactInput,
  UpdatePropertyContactInput,
} from "./contact.types";

export type PropertyTenant = PropertyContact;
export type CreatePropertyTenantInput = CreatePropertyContactInput;
export type UpdatePropertyTenantInput = UpdatePropertyContactInput;
