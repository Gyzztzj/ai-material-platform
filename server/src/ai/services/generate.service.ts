import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AiTask } from '../entities/ai-task.entity';
import { GenerateImageDto } from '../dto/generate-image.dto';
import { UserService } from 'src/user/user.service';
import { BaseTaskService } from './base-task.service';

@Injectable()
export class GenerateService extends BaseTaskService {
  constructor(
    @InjectRepository(AiTask)
    aiTaskRepository: Repository<AiTask>,
    userService: UserService,
    @InjectQueue('ai-queue')
    aiQueue: Queue,
  ) {
    super(aiTaskRepository, userService, aiQueue);
  }

  /**
   * 创建生成任务
   * @param userId 用户ID
   * @param generateImageDto 生成任务参数
   * @param isBatch 是否批量任务
   * @returns 任务ID
   */
  async createGenerateTask(
    userId: number,
    generateImageDto: GenerateImageDto,
    isBatch: boolean = false,
  ) {
    return this.createTask(
      userId,
      'generate',
      generateImageDto,
      isBatch,
      'generate',
    );
  }
}
