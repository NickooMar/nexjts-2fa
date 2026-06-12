/**
 * Client-side service layer for geographic reference data (countries, states,
 * cities). Unwraps the `{ success, error }` envelopes returned by the location
 * server actions into thrown ApiErrors so React Query can drive loading/error
 * states. The data is global and static, so the hooks cache it aggressively.
 */

import {
  LocationOption,
  listCitiesAction,
  listStatesAction,
  listCountriesAction,
} from "@/app/actions/location.actions";
import { ApiError } from "@/lib/react-query/types";

export type { LocationOption };

export async function fetchCountries(): Promise<LocationOption[]> {
  const result = await listCountriesAction();
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.countries;
}

export async function fetchStates(
  countryCode: string
): Promise<LocationOption[]> {
  const result = await listStatesAction(countryCode);
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.states;
}

export async function fetchCities(
  countryCode: string,
  stateCode: string
): Promise<LocationOption[]> {
  const result = await listCitiesAction(countryCode, stateCode);
  if (!result.success) throw new ApiError(result.error ?? "unknown_error");
  return result.cities;
}
