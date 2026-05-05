import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { TaskType, CallMode } from '../entities/ai-model.entity';

export class CreateAiModelDto {
  @IsNotEmpty()
  @IsString()
  modelId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsArray()
  @IsEnum(TaskType, { each: true })
  taskTypes: TaskType[];

  @IsOptional()
  @IsEnum(CallMode)
  callMode?: CallMode;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsNumber()
  quality?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  config?: any;

  @IsOptional()
  @IsArray()
  supportedSizes?: any[];
}

export class UpdateAiModelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(TaskType, { each: true })
  taskTypes?: TaskType[];

  @IsOptional()
  @IsEnum(CallMode)
  callMode?: CallMode;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsNumber()
  quality?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  config?: any;

  @IsOptional()
  @IsArray()
  supportedSizes?: any[];
}
