import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';
import { OnEvent } from '@nestjs/event-emitter';

export interface AuditEventPayload {
  action: string;
  resource: string;
  resourceId?: string;
  actorId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  @OnEvent('audit.log')
  async handleAuditLogEvent(payload: AuditEventPayload) {
    try {
      const auditEntry = this.auditRepository.create(payload);
      await this.auditRepository.save(auditEntry);
    } catch (error) {
      this.logger.error('Failed to save audit log', error);
    }
  }
}
