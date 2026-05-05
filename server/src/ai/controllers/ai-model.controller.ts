import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AiModelService } from '../services/ai-model.service';
import { CreateAiModelDto, UpdateAiModelDto } from '../dto/ai-model.dto';
import { TaskType } from '../entities/ai-model.entity';

@Controller('ai/models')
export class AiModelController {
  constructor(private readonly aiModelService: AiModelService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createAiModelDto: CreateAiModelDto) {
    return this.aiModelService.create(createAiModelDto);
  }

  @Get()
  findAll(@Query('taskType') taskType?: TaskType) {
    return this.aiModelService.findAll(taskType);
  }

  @Get('enabled')
  findEnabled(@Query('taskType') taskType?: TaskType) {
    return this.aiModelService.findEnabled(taskType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiModelService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateAiModelDto: UpdateAiModelDto) {
    return this.aiModelService.update(+id, updateAiModelDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.aiModelService.remove(+id);
  }
}
