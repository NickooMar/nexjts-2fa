import {
  IsIn,
  Min,
  IsInt,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export const PROPERTY_TYPES = [
  'apartment',
  'house',
  'commercial',
  'land',
  'other',
] as const;

export type PropertyTypeDto = (typeof PROPERTY_TYPES)[number];

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  type?: PropertyTypeDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  units?: number;
}
