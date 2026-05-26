import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AiTask } from '../entities/ai-task.entity';
import { ImageEditDto } from '../dto/image-edit.dto';
import { UserService } from 'src/user/user.service';
import { BaseTaskService } from './base-task.service';

@Injectable()
export class ImageEditService extends BaseTaskService {
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
   * 创建图片编辑任务
   * @param userId 用户ID
   * @param imageEditDto 图片编辑任务参数
   * @returns 任务ID
   */
  async createImageEditTask(userId: number, imageEditDto: ImageEditDto) {
    return this.createTask(
      userId,
      'image-edit',
      imageEditDto,
      false,
      'image-edit',
    );
  }
}
