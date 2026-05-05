import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AiTask } from '../entities/ai-task.entity';
import { ImageEditDto } from '../dto/image-edit.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ImageEditService {
  constructor(
    @InjectRepository(AiTask)
    private aiTaskRepository: Repository<AiTask>,
    private userService: UserService,
    @InjectQueue('ai-queue')
    private aiQueue: Queue,
  ) {}

  async createImageEditTask(userId: number, imageEditDto: ImageEditDto) {
    const user = await this.userService.findOne(userId);
    const priority = this.calculatePriority(user?.role, false);

    // 扣除积分
    await this.userService.deductCredits(userId, 1);

    const task = this.aiTaskRepository.create({
      userId,
      type: 'image-edit',
      params: imageEditDto,
      status: 'pending',
      progress: 0,
    });

    await this.aiTaskRepository.save(task);

    await this.aiQueue.add(
      'image-edit',
      {
        taskId: task.id,
        userId,
        imageEditDto,
      },
      {
        priority,
        timeout: 120000, // 2分钟超时
      },
    );

    return { taskId: task.id };
  }

  private calculatePriority(userRole: string | undefined, isBatch: boolean): number {
    if (isBatch) {
      return 3;
    }
    if (userRole === 'demo') {
      return 1;
    }
    return 5;
  }
}
