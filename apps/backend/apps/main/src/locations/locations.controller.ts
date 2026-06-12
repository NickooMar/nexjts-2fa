import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocationsService } from './locations.service';

/**
 * Geographic reference data backing the property location selectors
 * (Country → State → City). Read-only and global; behind auth for consistency
 * with the rest of the gateway since it is only used in authenticated flows.
 *
 * Cities are nested under both country and state because state ISO codes are
 * not globally unique and cities lack stable ids in the dataset.
 */
@Controller({ path: 'locations', version: '1' })
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get('countries')
  getCountries() {
    return { success: true, countries: this.locations.getCountries() };
  }

  @Get('countries/:countryCode/states')
  getStates(@Param('countryCode') countryCode: string) {
    return { success: true, states: this.locations.getStates(countryCode) };
  }

  @Get('countries/:countryCode/states/:stateCode/cities')
  getCities(
    @Param('countryCode') countryCode: string,
    @Param('stateCode') stateCode: string,
    @Query('search') search?: string,
  ) {
    return {
      success: true,
      cities: this.locations.getCities(countryCode, stateCode, search),
    };
  }
}
