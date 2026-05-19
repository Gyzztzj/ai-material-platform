import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Material } from './entities/material.entity';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { PreprocessMaterialDto } from './dto/preprocess.dto';
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

  async preprocessMaterial(
    id: number,
    userId: number,
    preprocessDto: PreprocessMaterialDto,
  ): Promise<Material> {
    const material = await this.findOne(id, userId);
    this.logger.log(
      '开始预处理素材，素材ID: ' +
        id +
        ', 配置: ' +
        JSON.stringify(preprocessDto),
    );

    const inputPath = path.join(process.cwd(), material.url);
    if (!fs.existsSync(inputPath)) {
      throw new NotFoundException('原始素材文件不存在');
    }

    const ext = preprocessDto.format || 'webp';
    const filename = `${uuidv4()}.${ext}`;
    const outputPath = path.join(process.cwd(), 'uploads', filename);
    const outputUrl = `/uploads/${filename}`;

    let image = sharp(inputPath);

    if (preprocessDto.maxWidth || preprocessDto.maxHeight) {
      image = image.resize(preprocessDto.maxWidth, preprocessDto.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (preprocessDto.brightness || preprocessDto.contrast) {
      const modulate: any = {};
      if (preprocessDto.brightness) {
        modulate.brightness = preprocessDto.brightness / 100;
      }
      if (preprocessDto.contrast) {
        modulate.saturation = preprocessDto.contrast / 100;
      }
      image = image.modulate(modulate);
    }

    if (preprocessDto.noiseReduction) {
      image = image.median(3);
    }

    if (ext === 'jpeg') {
      image = image.jpeg({ quality: preprocessDto.quality || 85 });
    } else if (ext === 'png') {
      image = image.png({ quality: preprocessDto.quality || 85 });
    } else {
      image = image.webp({ quality: preprocessDto.quality || 85 });
    }

    await image.toFile(outputPath);
    const stats = fs.statSync(outputPath);

    const newMaterial = await this.create(userId, {
      name: `${path.parse(material.name).name}_processed.${ext}`,
      url: outputUrl,
      size: stats.size,
      type: 'image',
    });

    this.logger.log('素材预处理完成，新素材ID: ' + newMaterial.id);
    return newMaterial;
  }

  async batchPreprocess(
    userId: number,
    materialIds: number[],
    preprocessDto: PreprocessMaterialDto,
  ): Promise<{ success: Material[]; failed: number[] }> {
    const success: Material[] = [];
    const failed: number[] = [];

    for (const id of materialIds) {
      try {
        const material = await this.preprocessMaterial(
          id,
          userId,
          preprocessDto,
        );
        success.push(material);
      } catch (error) {
        this.logger.error('批量预处理失败，素材ID: ' + id, error.stack);
        failed.push(id);
      }
    }

    return { success, failed };
  }
}
