import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TaskType {
  GENERATE = 'generate',
  REMOVE_BG = 'remove-bg',
  IMAGE_EDIT = 'image-edit',
}

export enum CallMode {
  SYNC = 'sync', // 同步调用
  ASYNC = 'async', // 异步调用
  BOTH = 'both', // 同时支持同步和异步
}

export interface SizeOption {
  value: string;
  label: string;
  aspectRatio: string;
}

@Entity({ name: 'ai_model' })
export class AiModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  modelId: string; // 唯一标识符，如 'tongyi-wanx', 'doubao-seedream'

  @Column()
  name: string; // 显示名称

  @Column()
  provider: string; // 服务商，如 'tongyi', 'doubao'

  @Column()
  model: string; // API模型名称

  @Column({ type: 'enum', enum: TaskType, array: true })
  taskTypes: TaskType[]; // 支持的任务类型

  @Column({ type: 'enum', enum: CallMode, default: CallMode.ASYNC })
  callMode: CallMode; // 调用方式

  @Column({ default: 1 })
  cost: number; // 消耗积分

  @Column({ default: 50 })
  quality: number; // 质量评分 0-100

  @Column({ default: true })
  enabled: boolean; // 是否启用

  @Column({ default: 0 })
  successCount: number; // 成功次数

  @Column({ default: 0 })
  failureCount: number; // 失败次数

  @Column({ type: 'jsonb', nullable: true })
  config: any; // 额外配置

  @Column({ type: 'jsonb', nullable: true })
  supportedSizes: SizeOption[]; // 支持的尺寸选项

  @Column({ default: 0 })
  sortOrder: number; // 排序顺序

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
