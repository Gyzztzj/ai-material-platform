import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AiTask } from '../entities/ai-task.entity';
import { RemoveBgDto } from '../dto/remove-bg.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RemoveBgService {
  constructor(
    @InjectRepository(AiTask)
    private aiTaskRepository: Repository<AiTask>,
    private userService: UserService,
    @InjectQueue('ai-queue')
    private aiQueue: Queue,
  ) {}

  async createRemoveBgTask(
    userId: number,
    removeBgDto: RemoveBgDto,
    isBatch: boolean = false,
  ) {
    const user = await this.userService.findOne(userId);
    const priority = this.calculatePriority(user?.role, isBatch);

    // 扣除积分
    await this.userService.deductCredits(userId, 1);

    const task = this.aiTaskRepository.create({
      userId,
      type: 'remove-bg',
      params: removeBgDto,
      status: 'pending',
      progress: 0,
    });

    await this.aiTaskRepository.save(task);

    await this.aiQueue.add(
      'remove-bg',
      {
        taskId: task.id,
        userId,
        removeBgDto,
      },
      {
        priority,
        timeout: 120000, // 2分钟超时
      },
    );

    return { taskId: task.id };
  }

  private calculatePriority(
    userRole: string | undefined,
    isBatch: boolean,
  ): number {
    if (isBatch) {
      return 3;
    }
    if (userRole === 'demo') {
      return 1;
    }
    return 5;
  }
}
