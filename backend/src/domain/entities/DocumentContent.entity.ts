import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Document } from './Document.entity';

@Entity('document_content')
@Index(['documentId'])
export class DocumentContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[];

  @Column({ type: 'integer', nullable: true })
  pageCount: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  extractionStatus: string; // pending, processing, completed, failed

  @Column({ type: 'text', nullable: true })
  extractionError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
