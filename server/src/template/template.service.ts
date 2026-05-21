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

  async findAll(
    userId: number,
    options?: {
      category?: string;
      isPublic?: boolean;
      search?: string;
    },
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Template>> {
    this.logger.log(
      'findAll 调用，用户ID:' + userId + '，参数:' + JSON.stringify(options),
    );
    const { page = 1, limit = 20 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.templateRepository.createQueryBuilder('template');

    // 构建基础访问控制条件
    if (options?.isPublic === true) {
      // 只看公开模板
      queryBuilder.where('template.isPublic = true');
    } else if (options?.isPublic === false) {
      // 只看自己的模板
      queryBuilder.where('template.userId = :userId', { userId });
    } else {
      // 默认：自己的模板 + 公开模板
      queryBuilder.where(
        'template.userId = :userId OR template.isPublic = true',
        {
          userId,
        },
      );
    }

    // 应用分类筛选
    if (options?.category) {
      this.logger.log('应用分类筛选:' + options.category);
      queryBuilder.andWhere('template.category = :category', {
        category: options.category,
      });
    }

    // 应用搜索筛选
    if (options?.search) {
      this.logger.log('应用搜索筛选:' + options.search);
      queryBuilder.andWhere(
        '(template.name ILIKE :search OR template.prompt ILIKE :search)',
        {
          search: `%${options.search}%`,
        },
      );
    } else {
      this.logger.log('没有应用搜索筛选');
    }

    const sql = queryBuilder.getSql();
    this.logger.log('生成的SQL: ' + sql);

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

  async remove(id: number, userId: number) {
    const template = await this.findOne(id, userId);
    if (template.userId !== userId) {
      throw new NotFoundException('无权删除此模板');
    }
    await this.templateRepository.remove(template);
    return { message: '删除成功' };
  }

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
