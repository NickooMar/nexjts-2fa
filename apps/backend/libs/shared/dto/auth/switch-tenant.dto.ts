import { IsString, IsNotEmpty } from 'class-validator';

export class SwitchTenantRequestDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
