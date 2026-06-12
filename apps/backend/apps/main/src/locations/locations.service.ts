import { Injectable } from '@nestjs/common';
import { City, Country, State } from 'country-state-city';

/**
 * A geographic option exposed to clients. The `id` is the value persisted on
 * the property; `name` is the human-readable label.
 *
 * - Countries: `id` is the ISO2 code (e.g. "AR").
 * - States: `id` is the ISO state code, unique only within its country.
 * - Cities: the dataset has no stable city id, so `id` is the city name.
 */
export interface LocationOption {
  id: string;
  name: string;
}

/**
 * Serves the static `country-state-city` dataset from gateway memory. The data
 * is global reference data (not tenant-scoped), so there is no microservice
 * round-trip — lookups are synchronous in-memory reads.
 */
@Injectable()
export class LocationsService {
  getCountries(): LocationOption[] {
    return Country.getAllCountries()
      .map((c) => ({ id: c.isoCode, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getStates(countryCode: string): LocationOption[] {
    return State.getStatesOfCountry(countryCode)
      .map((s) => ({ id: s.isoCode, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getCities(
    countryCode: string,
    stateCode: string,
    search?: string,
  ): LocationOption[] {
    const term = search?.trim().toLowerCase();
    return City.getCitiesOfState(countryCode, stateCode)
      .map((c) => ({ id: c.name, name: c.name }))
      .filter((c) => (term ? c.name.toLowerCase().includes(term) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
