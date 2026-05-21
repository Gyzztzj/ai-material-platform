import {
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  IsIn,
  MaxLength,
  MinLength,
} from 'class-validator';

const CATEGORIES = ['电商', '广告', '设计', '头像', '风景', '其他'] as const;
type Category = (typeof CATEGORIES)[number];

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  prompt: string;

  @IsString()
  @IsIn(CATEGORIES)
  category: Category;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  prompt?: string;

  @IsOptional()
  @IsString()
  @IsIn(CATEGORIES)
  category?: Category;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
