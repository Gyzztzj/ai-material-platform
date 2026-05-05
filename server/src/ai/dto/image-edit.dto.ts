import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ImageEditDto {
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @IsNotEmpty()
  @IsString()
  task: string; // 'background_replace', 'outpainting', 'style_transfer'

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  scale?: number;
}
