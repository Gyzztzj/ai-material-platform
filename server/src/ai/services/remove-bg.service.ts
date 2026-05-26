import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AiTask } from '../entities/ai-task.entity';
import { RemoveBgDto } from '../dto/remove-bg.dto';
import { UserService } from 'src/user/user.service';
import { BaseTaskService } from './base-task.service';

@Injectable()
export class RemoveBgService extends BaseTaskService {
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
   * 创建移除背景任务
   * @param userId 用户ID
   * @param removeBgDto 移除背景任务参数
   * @param isBatch 是否批量任务
   * @returns 任务ID
   */
  async createRemoveBgTask(
    userId: number,
    removeBgDto: RemoveBgDto,
    isBatch: boolean = false,
  ) {
    return this.createTask(
      userId,
      'remove-bg',
      removeBgDto,
      isBatch,
      'remove-bg',
    );
  }
}
