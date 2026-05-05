import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveBgDto {
  @IsNotEmpty()
  @IsString()
  imageUrl: string;
}
