import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AiTask } from '../entities/ai-task.entity';

@Injectable()
export class TaskCleanupService {
  private readonly logger = new Logger(TaskCleanupService.name);

  constructor(
    @InjectRepository(AiTask)
    private aiTaskRepository: Repository<AiTask>,
  ) {}

  @Cron('0 0 * * *')
  async cleanupOldTasks() {
    this.logger.log('开始执行任务清理...');

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const failedTasksResult = await this.aiTaskRepository.delete({
        status: 'failed',
        createdAt: LessThan(sevenDaysAgo),
      });
      this.logger.log(
        `已删除 ${failedTasksResult.affected} 个 7 天前的失败任务`,
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const completedTasksResult = await this.aiTaskRepository.delete({
        status: 'completed',
        createdAt: LessThan(thirtyDaysAgo),
      });
      this.logger.log(
        `已删除 ${completedTasksResult.affected} 个 30 天前的已完成任务`,
      );

      this.logger.log('任务清理完成');
    } catch (error) {
      this.logger.error('任务清理失败', error.stack);
    }
  }
}
