import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

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

export class BatchPreprocessDto {
  materialIds: number[];
  preprocess: PreprocessMaterialDto;
}
