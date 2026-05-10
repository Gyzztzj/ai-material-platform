import { Injectable } from '@nestjs/common';
import { AiModelService } from './services/ai-model.service';
import { AiModel, TaskType } from './entities/ai-model.entity';

@Injectable()
export class ModelSchedulerService {
  constructor(private aiModelService: AiModelService) {}

  async selectBestModel(taskType: TaskType): Promise<AiModel> {
    const models = await this.aiModelService.findEnabled(taskType);
    if (models.length === 0) {
      throw new Error('没有可用的模型');
    }

    return models.sort(
      (a, b) =>
        b.quality - a.quality || a.cost - b.cost || a.sortOrder - b.sortOrder,
    )[0];
  }

  async selectModelById(
    modelId: string,
    taskType: TaskType,
  ): Promise<AiModel | null> {
    const model = await this.aiModelService.findByModelId(modelId);
    if (model && model.enabled && model.taskTypes.includes(taskType)) {
      return model;
    }
    return null;
  }
}
