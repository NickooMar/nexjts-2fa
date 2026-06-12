import { IsArray, IsMongoId, ArrayNotEmpty } from 'class-validator';

/** Link one or more existing property tenants to a property. */
export class AttachPropertyTenantsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  tenantIds: string[];
}
