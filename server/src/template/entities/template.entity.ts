import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'template' })
@Index(['userId', 'isPublic', 'createdAt'])
@Index(['category', 'isPublic', 'createdAt'])
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Column()
  name: string;

  @Column('text')
  prompt: string;

  @Index()
  @Column()
  category: string;

  @Column('jsonb', { nullable: true })
  params?: Record<string, any>;

  @Column({ default: false })
  isPublic: boolean;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
