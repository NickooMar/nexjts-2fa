import { PropertyFormState } from "@/schemas/property.schema";
import {
  Property,
  CreatePropertyInput,
} from "@/types/property/property.types";

/** Map form values to the API payload, dropping empty optional fields. */
export function toPropertyInput(values: PropertyFormState): CreatePropertyInput {
  return {
    name: values.name.trim(),
    address: values.address.trim(),
    type: values.type,
    units: values.units,
    description: values.description?.trim() || undefined,
    city: values.city?.trim() || undefined,
    state: values.state?.trim() || undefined,
    country: values.country?.trim() || undefined,
    postalCode: values.postalCode?.trim() || undefined,
  };
}

/** Map an existing property to form default values for the edit dialog. */
export function toFormValues(property: Property): PropertyFormState {
  return {
    name: property.name,
    description: property.description ?? "",
    address: property.address,
    city: property.city ?? "",
    state: property.state ?? "",
    country: property.country ?? "",
    postalCode: property.postalCode ?? "",
    type: property.type,
    units: property.units,
  };
}
