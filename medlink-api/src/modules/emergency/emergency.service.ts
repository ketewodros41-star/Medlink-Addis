import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TriageEntry, TriageStatus } from "./entities/triage-entry.entity";
import { CreateTriageEntryDto } from "./dto/create-triage-entry.dto";
import { UpdateTriageStatusDto } from "./dto/update-triage-status.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";

const priorityMap: Record<number, { label: string; color: string }> = {
  1: { label: "Immediate", color: "#f87171" },
  2: { label: "Emergent", color: "#fb923c" },
  3: { label: "Urgent", color: "#facc15" },
  4: { label: "Semi-Urgent", color: "#a3d1df" },
  5: { label: "Non-Urgent", color: "#93a096" },
};

@Injectable()
export class EmergencyService {
  constructor(
    @InjectRepository(TriageEntry)
    private readonly triageRepo: Repository<TriageEntry>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(hospitalId: string, dto: CreateTriageEntryDto, actorId: string): Promise<TriageEntry> {
    const meta = priorityMap[dto.priority] || priorityMap[5];
    const entry = this.triageRepo.create({
      ...dto,
      hospitalId,
      priorityLabel: meta.label,
      color: meta.color,
      status: TriageStatus.WAITING,
      createdBy: actorId,
      updatedBy: actorId,
    });
    const saved = await this.triageRepo.save(entry);
    this.eventEmitter.emit("emergency.triage.created", {
      triageId: saved.id,
      patientId: saved.patientId,
      complaint: saved.complaint,
      priority: saved.priority,
      hospitalId,
      actorId,
    });
    return saved;
  }

  async findAll(hospitalId: string): Promise<TriageEntry[]> {
    return this.triageRepo.find({
      where: { hospitalId },
      relations: ["patient"],
      order: { priority: "ASC", arrivedAt: "ASC" },
    });
  }

  async findOne(id: string, hospitalId: string): Promise<TriageEntry> {
    const entry = await this.triageRepo.findOne({
      where: { id, hospitalId },
      relations: ["patient"],
    });
    if (!entry) throw new NotFoundException(`Triage entry ${id} not found`);
    return entry;
  }

  async updateStatus(id: string, hospitalId: string, dto: UpdateTriageStatusDto, actorId: string): Promise<TriageEntry> {
    const entry = await this.findOne(id, hospitalId);
    
    if (dto.status !== undefined) {
      entry.status = dto.status;
    }
    
    if (dto.priority !== undefined) {
      entry.priority = dto.priority;
      const meta = priorityMap[dto.priority] || priorityMap[5];
      entry.priorityLabel = meta.label;
      entry.color = meta.color;
    }
    
    entry.updatedBy = actorId;
    return this.triageRepo.save(entry);
  }
}
