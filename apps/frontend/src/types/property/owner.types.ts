/**
 * A property owner: a person who owns a property. Shares its shape with
 * {@link PropertyContact}; stored in a roster separate from renters.
 */
import {
  PropertyContact,
  CreatePropertyContactInput,
  UpdatePropertyContactInput,
} from "./contact.types";

export type PropertyOwner = PropertyContact;
export type CreatePropertyOwnerInput = CreatePropertyContactInput;
export type UpdatePropertyOwnerInput = UpdatePropertyContactInput;
