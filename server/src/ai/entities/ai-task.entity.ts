import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'ai_task' })
export class AiTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Column()
  type: string; // 'generate', 'remove-bg', 'batch'

  @Column('jsonb')
  params: any;

  @Index()
  @Column({ default: 'pending' })
  status: string; // 'pending', 'processing', 'completed', 'failed'

  @Column({ default: 0 })
  progress: number;

  @Column('jsonb', { nullable: true })
  result: any;

  @Column({ nullable: true })
  error: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
