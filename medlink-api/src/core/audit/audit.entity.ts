import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 255 })
  resource!: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId!: string;

  @Column({ type: 'uuid', nullable: true })
  actorId!: string;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, any>;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
