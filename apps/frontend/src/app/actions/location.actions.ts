"use server";

import { apiFetch } from "@/lib/api";

/**
 * A geographic option. `id` is the value persisted on the property
 * (country ISO2, state ISO code, or city name); `name` is the label.
 */
export interface LocationOption {
  id: string;
  name: string;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "unknown_error";

/** All countries (ISO2 codes). */
export const listCountriesAction = async (): Promise<{
  success: boolean;
  countries: LocationOption[];
  error?: string;
}> => {
  try {
    const data = await apiFetch<{
      success: boolean;
      countries: LocationOption[];
    }>("/locations/countries");
    return { success: true, countries: data.countries ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, countries: [], error: errorMessage(error) };
  }
};

/** States/provinces of a country. */
export const listStatesAction = async (
  countryCode: string
): Promise<{
  success: boolean;
  states: LocationOption[];
  error?: string;
}> => {
  try {
    const data = await apiFetch<{ success: boolean; states: LocationOption[] }>(
      `/locations/countries/${encodeURIComponent(countryCode)}/states`
    );
    return { success: true, states: data.states ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, states: [], error: errorMessage(error) };
  }
};

/** Cities of a state within a country. */
export const listCitiesAction = async (
  countryCode: string,
  stateCode: string
): Promise<{
  success: boolean;
  cities: LocationOption[];
  error?: string;
}> => {
  try {
    const data = await apiFetch<{ success: boolean; cities: LocationOption[] }>(
      `/locations/countries/${encodeURIComponent(
        countryCode
      )}/states/${encodeURIComponent(stateCode)}/cities`
    );
    return { success: true, cities: data.cities ?? [] };
  } catch (error) {
    console.error(error);
    return { success: false, cities: [], error: errorMessage(error) };
  }
};
