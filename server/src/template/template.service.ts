import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
  ) {}
  /**
   * 创建模板
   * @param userId 用户ID
   * @param createTemplateDto 模板创建参数
   * @returns 创建的模板
   */
  async create(
    userId: number,
    createTemplateDto: CreateTemplateDto,
  ): Promise<Template> {
    this.logger.log(
      '创建模板，用户ID: ' +
        userId +
        ', 数据: ' +
        JSON.stringify(createTemplateDto),
    );
    const template = this.templateRepository.create({
      userId,
      ...createTemplateDto,
    });
    return await this.templateRepository.save(template);
  }

  /**
   * 获取所有模板
   * @param userId 用户ID
   * @param options 查询选项
   * @param paginationDto 分页参数
   * @returns 分页结果
   */
  async findAll(
    userId: number,
    options?: {
      category?: string;
      isPublic?: boolean;
      search?: string;
    },
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Template>> {
    const { page = 1, limit = 20 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.templateRepository.createQueryBuilder('template');

    // 构建基础访问控制条件
    if (options?.isPublic === true) {
      queryBuilder.where('template.isPublic = true');
    } else if (options?.isPublic === false) {
      queryBuilder.where('template.userId = :userId', { userId });
    } else {
      queryBuilder.where(
        'template.userId = :userId OR template.isPublic = true',
        { userId },
      );
    }

    // 应用分类筛选
    if (options?.category) {
      queryBuilder.andWhere('template.category = :category', {
        category: options.category,
      });
    }

    // 应用搜索筛选
    if (options?.search) {
      queryBuilder.andWhere(
        '(template.name ILIKE :search OR template.prompt ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('template.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

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

  /**
   * 获取模板详情
   * @param id 模板ID
   * @param userId 用户ID
   * @returns 模板详情
   */
  async findOne(id: number, userId: number) {
    const template = await this.templateRepository.findOne({
      where: [
        { id, userId },
        { id, isPublic: true },
      ],
    });
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    return template;
  }
  /**
   * 更新模板
   * @param id 模板ID
   * @param userId 用户ID
   * @param updateTemplateDto 模板更新参数
   * @returns 更新后的模板
   */
  async update(
    id: number,
    userId: number,
    updateTemplateDto: UpdateTemplateDto,
  ) {
    const template = await this.findOne(id, userId);
    if (template.userId !== userId) {
      throw new NotFoundException('无权编辑此模板');
    }
    await this.templateRepository.update(id, updateTemplateDto);
    return this.findOne(id, userId);
  }
  /**
   * 删除模板
   * @param id 模板ID
   * @param userId 用户ID
   * @returns 删除成功消息
   */
  async remove(id: number, userId: number) {
    const template = await this.findOne(id, userId);
    if (template.userId !== userId) {
      throw new NotFoundException('无权删除此模板');
    }
    await this.templateRepository.remove(template);
    return { message: '删除成功' };
  }
  /**
   * 复制模板
   * @param id 模板ID
   * @param userId 用户ID
   * @returns 复制后的模板
   */
  async copyTemplate(id: number, userId: number): Promise<Template> {
    const template = await this.findOne(id, userId);
    const newTemplate = this.templateRepository.create({
      userId,
      name: `${template.name} (副本)`,
      prompt: template.prompt,
      category: template.category,
      params: template.params,
      isPublic: false,
    });
    return await this.templateRepository.save(newTemplate);
  }
}
