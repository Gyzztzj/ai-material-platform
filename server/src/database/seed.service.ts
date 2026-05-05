import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AiModelService } from '../ai/services/ai-model.service';
import { DEFAULT_AI_MODELS } from './seed-data';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private aiModelService: AiModelService) {}

  async onModuleInit() {
    await this.seedAiModels();
  }

  private async seedAiModels() {
    try {
      const createdModels = await this.aiModelService.batchCreate(DEFAULT_AI_MODELS);
      if (createdModels.length > 0) {
        this.logger.log(`成功初始化 ${createdModels.length} 个 AI 模型`);
      } else {
        this.logger.log('AI 模型已存在，跳过初始化');
      }
    } catch (error) {
      this.logger.error('初始化 AI 模型失败:', error);
    }
  }
}
