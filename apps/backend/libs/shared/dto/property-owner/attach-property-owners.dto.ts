import { IsArray, IsMongoId, ArrayNotEmpty } from 'class-validator';

/** Link one or more existing property owners to a property. */
export class AttachPropertyOwnersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ownerIds: string[];
}
