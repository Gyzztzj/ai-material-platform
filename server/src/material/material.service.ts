import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { Material } from './entities/material.entity';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { PreprocessMaterialDto, SizeSpec } from './dto/preprocess.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
const uuid = require('uuid').v4;

@Injectable()
export class MaterialService {
  private readonly logger = new Logger(MaterialService.name);

  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}
  /**
   * 创建素材
   * @param userId 用户ID
   * @param createMaterialDto 素材创建参数
   * @returns 创建的素材
   */
  async create(userId: number, createMaterialDto: any): Promise<Material> {
    const material = this.materialRepository.create({
      userId,
      ...createMaterialDto,
    });
    const result = await this.materialRepository.save(material);
    return Array.isArray(result) ? result[0] : result;
  }
  /**
   * 获取所有素材
   * @param userId 用户ID
   * @param category 素材分类
   * @param paginationDto 分页参数
   * @returns 分页结果
   */
  async findAll(
    userId: number,
    category?: string,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Material>> {
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

    const [data, total] = await queryBuilder
      .orderBy('material.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: { page, limit, total, totalPages },
    };
  }
  /**
   * 获取素材详情
   * @param id 素材ID
   * @param userId 用户ID
   * @returns 素材详情
   */
  async findOne(id: number, userId: number) {
    const material = await this.materialRepository.findOneBy({ id, userId });
    if (!material) {
      throw new NotFoundException('素材不存在');
    }
    return material;
  }
  /**
   * 更新素材
   * @param id 素材ID
   * @param userId 用户ID
   * @param updateMaterialDto 素材更新参数
   * @returns 更新后的素材
   */
  async update(
    id: number,
    userId: number,
    updateMaterialDto: UpdateMaterialDto,
  ) {
    await this.findOne(id, userId);
    await this.materialRepository.update(id, updateMaterialDto);
    return this.findOne(id, userId);
  }
  /**
   * 删除素材
   * @param id 素材ID
   * @param userId 用户ID
   * @returns 删除成功消息
   */
  async remove(id: number, userId: number) {
    const material = await this.findOne(id, userId);
    await this.materialRepository.remove(material);
    return { message: '删除成功' };
  }
  /**
   * 预处理素材
   * @param id 素材ID
   * @param userId 用户ID
   * @param preprocessDto 预处理配置
   * @returns 预处理后的素材
   */
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
    const filename = `${uuid()}.${ext}`;
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
  /**
   * 批量预处理素材
   * @param userId 用户ID
   * @param materialIds 素材ID列表
   * @param preprocessDto 预处理配置
   * @returns 成功和失败的素材ID列表
   */
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
        this.logger.error(
          `批量预处理失败，素材ID: ${id}`,
          error instanceof Error ? error.stack : undefined,
        );
        failed.push(id);
      }
    }

    return { success, failed };
  }

  /**
   * 批量多尺寸导出
   * @param userId 用户ID
   * @param materialIds 素材ID列表
   * @param sizes 尺寸规格列表
   * @param format 输出格式
   * @param quality 输出质量
   * @returns 成功导出的结果列表
   */
  async batchMultiSizeExport(
    userId: number,
    materialIds: number[],
    sizes: SizeSpec[],
    format: 'jpeg' | 'png' | 'webp' = 'webp',
    quality: number = 85,
  ): Promise<{
    success: Array<{
      materialId: number;
      name: string;
      files: Array<{ size: string; material: Material }>;
    }>;
    failed: number[];
  }> {
    const success: Array<{
      materialId: number;
      name: string;
      files: Array<{ size: string; material: Material }>;
    }> = [];
    const failed: number[] = [];

    for (const id of materialIds) {
      try {
        const material = await this.findOne(id, userId);
        const inputPath = path.join(process.cwd(), material.url);

        if (!fs.existsSync(inputPath)) {
          throw new NotFoundException('原始素材文件不存在');
        }

        const files: Array<{ size: string; material: Material }> = [];

        for (const sizeSpec of sizes) {
          const ext = format;
          const filename = `${uuid()}.${ext}`;
          const outputPath = path.join(process.cwd(), 'uploads', filename);
          const outputUrl = `/uploads/${filename}`;
          const sizeLabel = `${sizeSpec.width}x${sizeSpec.height}`;

          let image = sharp(inputPath);

          if (sizeSpec.width > 0 && sizeSpec.height > 0) {
            image = image.resize(sizeSpec.width, sizeSpec.height, {
              fit: 'fill',
              withoutEnlargement: false,
            });
          }

          if (ext === 'jpeg') {
            image = image.jpeg({ quality });
          } else if (ext === 'png') {
            image = image.png({ quality });
          } else {
            image = image.webp({ quality });
          }

          await image.toFile(outputPath);
          const stats = fs.statSync(outputPath);

          const newMaterial = await this.create(userId, {
            name: `${path.parse(material.name).name}_${sizeLabel}.${ext}`,
            url: outputUrl,
            size: stats.size,
            type: 'image',
          });

          files.push({ size: sizeLabel, material: newMaterial });
        }

        success.push({ materialId: id, name: material.name, files });
      } catch (error) {
        this.logger.error(
          `多尺寸导出失败，素材ID: ${id}`,
          error instanceof Error ? error.stack : undefined,
        );
        failed.push(id);
      }
    }

    return { success, failed };
  }
}
