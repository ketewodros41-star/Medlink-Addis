import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QueueEntry } from "./entities/queue-entry.entity";
import { CreateQueueEntryDto } from "./dto/create-queue-entry.dto";
import { UpdateQueueStatusDto } from "./dto/update-queue-status.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class PatientQueueService {
  constructor(
    @InjectRepository(QueueEntry)
    private readonly queueRepo: Repository<QueueEntry>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(hospitalId: string, dto: CreateQueueEntryDto, actorId: string): Promise<QueueEntry> {
    const count = await this.queueRepo.count({ where: { hospitalId } });
    const queueNumber = `Q-${String(1001 + count)}`;

    const entry = this.queueRepo.create({
      ...dto,
      hospitalId,
      queueNumber,
      status: "Waiting",
      estimatedWaitMins: 15,
      createdBy: actorId,
      updatedBy: actorId,
    });

    const saved = await this.queueRepo.save(entry);

    // Emit event for patient timeline
    this.eventEmitter.emit("emergency.triage.status", {
      patientId: saved.patientId,
      hospitalId,
      status: `Joined ${saved.currentDept} Queue`,
      actorId,
    });

    return saved;
  }

  async findAll(hospitalId: string, currentDept?: string): Promise<QueueEntry[]> {
    const where: any = { hospitalId };
    if (currentDept) where.currentDept = currentDept;

    return this.queueRepo.find({
      where,
      relations: ["patient"],
      order: { createdAt: "ASC" },
    });
  }

  async findOne(id: string, hospitalId: string): Promise<QueueEntry> {
    const entry = await this.queueRepo.findOne({
      where: { id, hospitalId },
      relations: ["patient"],
    });
    if (!entry) throw new NotFoundException(`Queue entry ${id} not found`);
    return entry;
  }

  async updateStatus(id: string, hospitalId: string, dto: UpdateQueueStatusDto, actorId: string): Promise<QueueEntry> {
    const entry = await this.findOne(id, hospitalId);

    entry.status = dto.status;
    if (dto.currentDept !== undefined) entry.currentDept = dto.currentDept;

    if (dto.status === "Called") {
      entry.calledAt = new Date();
    }

    entry.updatedBy = actorId;
    const saved = await this.queueRepo.save(entry);

    // Emit event
    this.eventEmitter.emit("emergency.triage.status", {
      patientId: saved.patientId,
      hospitalId,
      status: `Queue Status: ${saved.status} in ${saved.currentDept}`,
      actorId,
    });

    return saved;
  }
}
