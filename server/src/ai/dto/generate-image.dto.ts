import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateImageDto {
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  n?: number;

  @IsOptional()
  @IsString()
  modelId?: string;
}
