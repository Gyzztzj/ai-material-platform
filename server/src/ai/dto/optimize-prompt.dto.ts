import { IsNotEmpty, IsString } from 'class-validator';

export class OptimizePromptDto {
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @IsString()
  style?: string;
}
