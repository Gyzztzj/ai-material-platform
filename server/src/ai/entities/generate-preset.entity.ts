import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'generate_preset' })
@Index(['userId', 'createdAt'])
export class GeneratePreset {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Column()
  name: string;

  @Column('text')
  prompt: string;

  @Column({ nullable: true })
  modelId: string;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  style: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
