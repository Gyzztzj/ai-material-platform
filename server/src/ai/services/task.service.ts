import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { AiTask } from '../entities/ai-task.entity';
import { BatchGenerateDto, BatchRemoveBgDto } from '../dto/batch-task.dto';
import { OptimizePromptDto } from '../dto/optimize-prompt.dto';
import { AIUtils } from '../../common/utils/ai.utils';
import { GenerateService } from './generate.service';
import { RemoveBgService } from './remove-bg.service';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class TaskService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(AiTask)
    private aiTaskRepository: Repository<AiTask>,
    private generateService: GenerateService,
    private removeBgService: RemoveBgService,
  ) {}

  async getTask(taskId: number) {
    return this.aiTaskRepository.findOneBy({ id: taskId });
  }

  async getUserTasks(
    userId: number,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<AiTask>> {
    const { page = 1, limit = 20 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const [data, total] = await this.aiTaskRepository.findAndCount({
      select: [
        'id',
        'type',
        'params',
        'status',
        'progress',
        'result',
        'error',
        'createdAt',
        'updatedAt',
      ],
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async createBatchGenerateTask(
    userId: number,
    batchGenerateDto: BatchGenerateDto,
  ) {
    const taskIds: number[] = [];

    for (const taskDto of batchGenerateDto.tasks) {
      const task = await this.generateService.createGenerateTask(
        userId,
        taskDto,
        true, // isBatch
      );
      taskIds.push(task.taskId);
    }

    return { batchId: Date.now().toString(), taskIds };
  }

  async createBatchRemoveBgTask(
    userId: number,
    batchRemoveBgDto: BatchRemoveBgDto,
  ) {
    const taskIds: number[] = [];

    for (const taskDto of batchRemoveBgDto.tasks) {
      const task = await this.removeBgService.createRemoveBgTask(
        userId,
        taskDto,
        true, // isBatch
      );
      taskIds.push(task.taskId);
    }

    return { batchId: Date.now().toString(), taskIds };
  }

  async optimizePrompt(optimizePromptDto: OptimizePromptDto) {
    const apiKey = this.configService.get('TONGYI_API_KEY');
    const baseUrl = 'https://dashscope.aliyuncs.com/api/v1';

    const systemPrompt = `你是专业的AI绘画提示词工程师。请将用户输入的简单描述，优化成详细、专业的AI绘画提示词。
要求：
1.  添加细节描述：光线、材质、构图、色彩、风格
2.  加入专业术语，提升生成质量
3.  长度控制在100-200字之间
4.  只返回优化后的提示词，不要任何解释`;

    const response = await AIUtils.request(
      {
        method: 'POST',
        url: `${baseUrl}/services/aigc/text-generation/generation`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        data: {
          model: 'qwen-turbo',
          input: {
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: `优化这个提示词：${optimizePromptDto.prompt}，风格：${optimizePromptDto.style || '通用'}`,
              },
            ],
          },
          parameters: {
            result_format: 'message',
            temperature: 0.7,
          },
        },
      },
      30000,
    );

    return {
      optimizedPrompt: (
        response as any
      ).output.choices[0].message.content.trim(),
    };
  }
}
