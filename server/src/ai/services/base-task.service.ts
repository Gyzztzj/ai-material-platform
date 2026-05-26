import { Repository } from 'typeorm';
import type { Queue } from 'bull';
import { AiTask } from '../entities/ai-task.entity';
import { UserService } from 'src/user/user.service';

export abstract class BaseTaskService {
  constructor(
    protected readonly aiTaskRepository: Repository<AiTask>,
    protected readonly userService: UserService,
    protected readonly aiQueue: Queue,
  ) {}

  /**
   * 计算任务优先级
   * @param userRole 用户角色
   * @param isBatch 是否批量任务
   * @returns 优先级
   */
  protected calculatePriority(
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

  /**
   * 创建任务
   * @param userId 用户ID
   * @param taskType 任务类型
   * @param params 任务参数
   * @param isBatch 是否批量任务
   * @param jobName 任务队列名称
   * @returns 任务ID
   */
  protected async createTask(
    userId: number,
    taskType: string,
    params: any,
    isBatch: boolean = false,
    jobName?: string,
  ): Promise<{ taskId: number }> {
    const user = await this.userService.findOne(userId);
    const priority = this.calculatePriority(user?.role, isBatch);

    // 扣除积分
    await this.userService.deductCredits(userId, 1);

    const task = this.aiTaskRepository.create({
      userId,
      type: taskType,
      params,
      status: 'pending',
      progress: 0,
    });

    await this.aiTaskRepository.save(task);

    await this.aiQueue.add(
      jobName || taskType,
      {
        taskId: task.id,
        userId,
        params,
      },
      {
        priority,
        timeout: 120000, // 2分钟超时
      },
    );

    return { taskId: task.id };
  }
}
