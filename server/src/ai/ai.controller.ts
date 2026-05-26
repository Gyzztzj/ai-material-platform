import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GenerateImageDto } from './dto/generate-image.dto';
import { RemoveBgDto } from './dto/remove-bg.dto';
import { BatchGenerateDto, BatchRemoveBgDto } from './dto/batch-task.dto';
import { OptimizePromptDto } from './dto/optimize-prompt.dto';
import { ImageEditDto } from './dto/image-edit.dto';
import { GenerateService } from './services/generate.service';
import { RemoveBgService } from './services/remove-bg.service';
import { ImageEditService } from './services/image-edit.service';
import { TaskService } from './services/task.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CacheService } from '../common/cache.service';
import { AiModelService } from './services/ai-model.service';
import { TaskType } from './entities/ai-model.entity';

@Controller('ai')
export class AiController {
  constructor(
    private readonly generateService: GenerateService,
    private readonly removeBgService: RemoveBgService,
    private readonly imageEditService: ImageEditService,
    private readonly taskService: TaskService,
    private readonly cacheService: CacheService,
    private readonly aiModelService: AiModelService,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  generateImage(
    @CurrentUser() user,
    @Body() generateImageDto: GenerateImageDto,
  ) {
    return this.generateService.createGenerateTask(user.id, generateImageDto);
  }

  @Get('tasks')
  @UseGuards(JwtAuthGuard)
  getUserTasks(@CurrentUser() user, @Query() paginationDto?: PaginationDto) {
    return this.taskService.getUserTasks(user.id, paginationDto);
  }

  @Get('tasks/:taskId')
  @UseGuards(JwtAuthGuard)
  getTask(@CurrentUser() user, @Param('taskId') taskId: string) {
    return this.taskService.getTask(+taskId, user.id);
  }

  @Post('remove-bg')
  @UseGuards(JwtAuthGuard)
  removeBg(@CurrentUser() user, @Body() removeBgDto: RemoveBgDto) {
    return this.removeBgService.createRemoveBgTask(user.id, removeBgDto);
  }

  @Post('batch/generate')
  @UseGuards(JwtAuthGuard)
  batchGenerate(
    @CurrentUser() user,
    @Body() batchGenerateDto: BatchGenerateDto,
  ) {
    return this.taskService.createBatchGenerateTask(user.id, batchGenerateDto);
  }

  @Post('batch/remove-bg')
  @UseGuards(JwtAuthGuard)
  batchRemoveBg(
    @CurrentUser() user,
    @Body() batchRemoveBgDto: BatchRemoveBgDto,
  ) {
    return this.taskService.createBatchRemoveBgTask(user.id, batchRemoveBgDto);
  }

  @Post('optimize-prompt')
  @UseGuards(JwtAuthGuard)
  optimizePrompt(
    @CurrentUser() user,
    @Body() optimizePromptDto: OptimizePromptDto,
  ) {
    return this.taskService.optimizePrompt(optimizePromptDto);
  }

  @Post('image-edit')
  @UseGuards(JwtAuthGuard)
  imageEdit(@CurrentUser() user, @Body() imageEditDto: ImageEditDto) {
    return this.imageEditService.createImageEditTask(user.id, imageEditDto);
  }

  @Get('models')
  async getModels(@Query('taskType') taskTypeStr?: string) {
    let taskType: TaskType | undefined;
    if (taskTypeStr) {
      // 归一化任务类型参数
      const normalizedTaskType = taskTypeStr.toLowerCase().replace('_', '-');
      // 检查是否是有效的任务类型
      if (Object.values(TaskType).includes(normalizedTaskType as TaskType)) {
        taskType = normalizedTaskType as TaskType;
      }
    }

    const cacheKey = taskType ? `ai:models:${taskType}` : 'ai:models';
    let models = await this.cacheService.get(cacheKey);
    if (!models) {
      models = await this.aiModelService.findEnabled(taskType);
      await this.cacheService.set(cacheKey, models, 300); // 缓存5分钟
    }
    // 根据taskType返回对应的模型
    if (taskType === TaskType.GENERATE) {
      return { generate: models };
    } else if (taskType === TaskType.REMOVE_BG) {
      return { removeBg: models };
    } else if (taskType === TaskType.IMAGE_EDIT) {
      return { imageEdit: models };
    } else {
      // 如果没有指定taskType或无效，返回所有模型分组
      const allModels = await this.aiModelService.findEnabled();
      return {
        generate: allModels.filter((m) =>
          m.taskTypes.includes(TaskType.GENERATE),
        ),
        removeBg: allModels.filter((m) =>
          m.taskTypes.includes(TaskType.REMOVE_BG),
        ),
        imageEdit: allModels.filter((m) =>
          m.taskTypes.includes(TaskType.IMAGE_EDIT),
        ),
      };
    }
  }
}
