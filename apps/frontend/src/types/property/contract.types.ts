import { MediaAsset } from "./property.types";

export const CONTRACT_TYPES = [
  "rental",
  "sale",
  "management",
  "other",
] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_STATUSES = [
  "draft",
  "active",
  "expired",
  "terminated",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const PAYMENT_FREQUENCIES = [
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
  "one_time",
] as const;

export type PaymentFrequency = (typeof PAYMENT_FREQUENCIES)[number];

/** Common ISO 4217 codes offered in the contract form (free list, not exhaustive). */
export const CONTRACT_CURRENCIES = [
  "USD",
  "EUR",
  "ARS",
  "BRL",
  "CLP",
  "COP",
  "MXN",
  "UYU",
  "GBP",
] as const;

export interface Contract {
  _id: string;
  uuid: string;
  propertyId: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  startDate?: string;
  endDate?: string;
  amount?: number;
  currency?: string;
  paymentFrequency?: PaymentFrequency;
  deposit?: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  /** Present on list payloads (storage keys already resolved to URLs). */
  images?: MediaAsset[];
  documents?: MediaAsset[];
}

export interface CreateContractInput {
  title: string;
  type?: ContractType;
  status?: ContractStatus;
  startDate?: string;
  endDate?: string;
  amount?: number;
  currency?: string;
  paymentFrequency?: PaymentFrequency;
  deposit?: number;
  notes?: string;
}

export type UpdateContractInput = Partial<CreateContractInput>;
