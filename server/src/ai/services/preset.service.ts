import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneratePreset } from '../entities/generate-preset.entity';
import { CreatePresetDto, UpdatePresetDto } from '../dto/generate-preset.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class PresetService {
  private readonly logger = new Logger(PresetService.name);

  constructor(
    @InjectRepository(GeneratePreset)
    private presetRepository: Repository<GeneratePreset>,
  ) {}

  async create(
    userId: number,
    createPresetDto: CreatePresetDto,
  ): Promise<GeneratePreset> {
    this.logger.log(
      `创建参数预设，用户ID: ${userId}, 名称: ${createPresetDto.name}`,
    );
    const preset = this.presetRepository.create({ userId, ...createPresetDto });
    return await this.presetRepository.save(preset);
  }

  async findAll(
    userId: number,
    options?: { search?: string },
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<GeneratePreset>> {
    const { page = 1, limit = 20 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.presetRepository.createQueryBuilder('preset');

    queryBuilder.where('preset.userId = :userId', { userId });

    if (options?.search) {
      queryBuilder.andWhere(
        '(preset.name ILIKE :search OR preset.prompt ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('preset.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: { page, limit, total, totalPages },
    };
  }

  async findOne(id: number, userId: number) {
    const preset = await this.presetRepository.findOne({
      where: { id, userId },
    });
    if (!preset) {
      throw new NotFoundException('参数预设不存在');
    }
    return preset;
  }

  async update(id: number, userId: number, updatePresetDto: UpdatePresetDto) {
    const preset = await this.findOne(id, userId);
    if (preset.userId !== userId) {
      throw new NotFoundException('无权编辑此预设');
    }
    await this.presetRepository.update(id, updatePresetDto);
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    const preset = await this.findOne(id, userId);
    if (preset.userId !== userId) {
      throw new NotFoundException('无权删除此预设');
    }
    await this.presetRepository.remove(preset);
    return { message: '删除成功' };
  }
}
