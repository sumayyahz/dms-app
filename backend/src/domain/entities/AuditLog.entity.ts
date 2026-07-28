import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { Document } from './Document.entity';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  PROCESSING = 'processing',
  PROCESS_SUCCESS = 'process_success',
  PROCESS_FAILED = 'process_failed',
  RESTORE = 'restore',
}

@Entity('audit_logs')
@Index(['user', 'createdAt'])
@Index(['document', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ type: 'varchar', length: 255, nullable: true })
  entityType: string;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  user: User;

  @ManyToOne(() => Document, (document) => document.auditLogs, {
    nullable: true,
  })
  document: Document;

  @CreateDateColumn()
  createdAt: Date;
}
