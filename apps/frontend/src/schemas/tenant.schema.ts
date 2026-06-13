/** Property tenant (renter) — shares the generic contact schema. */
import { contactSchema, ContactFormState } from "./contact.schema";

export const tenantSchema = contactSchema;
export type TenantFormState = ContactFormState;
