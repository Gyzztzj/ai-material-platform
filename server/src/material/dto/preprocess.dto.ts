import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PreprocessMaterialDto {
  @IsString()
  @IsOptional()
  format?: 'jpeg' | 'png' | 'webp';

  @IsInt()
  @Min(10)
  @Max(100)
  @IsOptional()
  quality?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxWidth?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxHeight?: number;

  @IsBoolean()
  @IsOptional()
  noiseReduction?: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  brightness?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  contrast?: number;
}

export class SizeSpec {
  @IsInt()
  @Min(1)
  width: number;

  @IsInt()
  @Min(1)
  height: number;
}

export class BatchPreprocessDto {
  materialIds: number[];
  preprocess: PreprocessMaterialDto;
}

export class BatchMultiSizeDto {
  materialIds: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SizeSpec)
  sizes: SizeSpec[];

  @IsString()
  @IsOptional()
  format?: 'jpeg' | 'png' | 'webp';

  @IsInt()
  @Min(10)
  @Max(100)
  @IsOptional()
  quality?: number;
}
