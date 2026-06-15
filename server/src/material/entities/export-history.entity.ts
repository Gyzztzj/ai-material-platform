import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'export_history' })
export class ExportHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Column('simple-json')
  materialIds: number[];

  @Column('simple-json')
  sizes: { width: number; height: number }[];

  @Column()
  format: string;

  @Column()
  quality: number;

  @Column()
  totalFiles: number;

  @Column({ default: 'completed' })
  status: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
