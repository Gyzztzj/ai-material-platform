import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class MaterialService {
  private readonly logger = new Logger(MaterialService.name);

  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async create(userId: number, createMaterialDto: any): Promise<Material> {
    this.logger.log(
      '开始创建素材，用户ID: ' +
        userId +
        ', 数据: ' +
        JSON.stringify(createMaterialDto),
    );
    try {
      const material = this.materialRepository.create({
        userId,
        ...createMaterialDto,
      });
      this.logger.log('素材对象创建成功: ' + JSON.stringify(material));
      const result = await this.materialRepository.save(material);
      this.logger.log('素材保存到数据库成功: ' + JSON.stringify(result));
      const savedResult = Array.isArray(result) ? result[0] : result;
      this.logger.log('返回的素材对象: ' + JSON.stringify(savedResult));
      return savedResult;
    } catch (error) {
      this.logger.error('素材保存失败: ' + error.message, error.stack);
      throw error;
    }
  }

  async findAll(
    userId: number,
    category?: string,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Material>> {
    this.logger.log('查询素材列表，用户ID: ' + userId + ', 分类: ' + category);
    const { page = 1, limit = 20 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.materialRepository
      .createQueryBuilder('material')
      .select([
        'material.id',
        'material.name',
        'material.url',
        'material.size',
        'material.type',
        'material.category',
        'material.createdAt',
        'material.updatedAt',
      ])
      .where('material.userId = :userId', { userId });

    if (category) {
      queryBuilder.andWhere('material.category = :category', { category });
    }

    const query = queryBuilder.getSql();
    this.logger.log('执行的SQL查询: ' + query);
    const [data, total] = await queryBuilder
      .orderBy('material.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    this.logger.log(
      '查询结果 - 总数: ' + total + ', 当前页数据: ' + data.length,
    );
    this.logger.log('返回的数据: ' + JSON.stringify(data));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: number, userId: number) {
    const material = await this.materialRepository.findOneBy({ id, userId });
    if (!material) {
      throw new NotFoundException('素材不存在');
    }
    return material;
  }

  async update(
    id: number,
    userId: number,
    updateMaterialDto: UpdateMaterialDto,
  ) {
    await this.findOne(id, userId);
    await this.materialRepository.update(id, updateMaterialDto);
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    const material = await this.findOne(id, userId);
    await this.materialRepository.remove(material);
    return { message: '删除成功' };
  }
}
