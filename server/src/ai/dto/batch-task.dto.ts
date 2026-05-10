import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GenerateImageDto } from './generate-image.dto';
import { RemoveBgDto } from './remove-bg.dto';

export class BatchGenerateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerateImageDto)
  tasks: GenerateImageDto[];
}

export class BatchRemoveBgDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RemoveBgDto)
  tasks: RemoveBgDto[];
}
