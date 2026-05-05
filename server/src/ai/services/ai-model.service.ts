import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModel, TaskType, CallMode } from '../entities/ai-model.entity';
import { CreateAiModelDto, UpdateAiModelDto } from '../dto/ai-model.dto';

@Injectable()
export class AiModelService {
  constructor(
    @InjectRepository(AiModel)
    private aiModelRepository: Repository<AiModel>,
  ) {}

  async create(createAiModelDto: CreateAiModelDto): Promise<AiModel> {
    const model = this.aiModelRepository.create({
      ...createAiModelDto,
      enabled: createAiModelDto.enabled ?? true,
      callMode: createAiModelDto.callMode ?? CallMode.ASYNC,
      cost: createAiModelDto.cost ?? 1,
      quality: createAiModelDto.quality ?? 50,
      sortOrder: createAiModelDto.sortOrder ?? 0,
    });
    return this.aiModelRepository.save(model);
  }

  async findAll(taskType?: TaskType): Promise<AiModel[]> {
    const queryBuilder = this.aiModelRepository
      .createQueryBuilder('model')
      .orderBy('model.sortOrder', 'ASC')
      .addOrderBy('model.quality', 'DESC');

    if (taskType) {
      queryBuilder.where(':taskType = ANY(model.taskTypes)', { taskType });
    }

    return queryBuilder.getMany();
  }

  async findEnabled(taskType?: TaskType): Promise<AiModel[]> {
    const models = await this.findAll(taskType);
    return models.filter((m) => m.enabled);
  }

  async findOne(id: number): Promise<AiModel> {
    const model = await this.aiModelRepository.findOneBy({ id });
    if (!model) {
      throw new NotFoundException(`Model with ID ${id} not found`);
    }
    return model;
  }

  async findByModelId(modelId: string): Promise<AiModel | null> {
    return this.aiModelRepository.findOneBy({ modelId });
  }

  async update(
    id: number,
    updateAiModelDto: UpdateAiModelDto,
  ): Promise<AiModel> {
    const model = await this.findOne(id);
    Object.assign(model, updateAiModelDto);
    return this.aiModelRepository.save(model);
  }

  async remove(id: number): Promise<void> {
    const model = await this.findOne(id);
    await this.aiModelRepository.remove(model);
  }

  async recordSuccess(modelId: string): Promise<void> {
    await this.aiModelRepository
      .createQueryBuilder()
      .update(AiModel)
      .set({ successCount: () => 'successCount + 1' })
      .where('modelId = :modelId', { modelId })
      .execute();
  }

  async recordFailure(modelId: string): Promise<void> {
    await this.aiModelRepository
      .createQueryBuilder()
      .update(AiModel)
      .set({ failureCount: () => 'failureCount + 1' })
      .where('modelId = :modelId', { modelId })
      .execute();
  }

  async batchCreate(models: CreateAiModelDto[]): Promise<AiModel[]> {
    const createdModels: AiModel[] = [];
    for (const dto of models) {
      const existing = await this.findByModelId(dto.modelId);
      if (!existing) {
        const model = await this.create(dto);
        createdModels.push(model);
      }
    }
    return createdModels;
  }
}
