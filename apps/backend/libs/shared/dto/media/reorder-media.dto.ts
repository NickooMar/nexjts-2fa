import { IsArray, ArrayNotEmpty, IsMongoId } from 'class-validator';

export class ReorderMediaDto {
  /** Media asset ids in their new display order (index = position). */
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  orderedIds: string[];
}
