import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LabOrder, LabOrderStatus } from "./entities/lab-order.entity";
import { CreateLabOrderDto } from "./dto/create-lab-order.dto";
import { UpdateLabResultDto } from "./dto/update-lab-result.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class LaboratoryService {
  constructor(
    @InjectRepository(LabOrder)
    private readonly labOrderRepo: Repository<LabOrder>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(hospitalId: string, dto: CreateLabOrderDto, doctorId: string): Promise<LabOrder> {
    const order = this.labOrderRepo.create({
      ...dto,
      hospitalId,
      doctorId,
      status: LabOrderStatus.PENDING,
    });
    const saved = await this.labOrderRepo.save(order);
    this.eventEmitter.emit("clinical.lab.ordered", {
      orderId: saved.id,
      patientId: saved.patientId,
      testName: saved.testName,
      hospitalId,
      actorId: doctorId,
    });
    return saved;
  }

  async findAll(hospitalId: string, query?: { patientId?: string; status?: LabOrderStatus }): Promise<LabOrder[]> {
    const where: any = { hospitalId };
    if (query?.patientId) where.patientId = query.patientId;
    if (query?.status) where.status = query.status;

    return this.labOrderRepo.find({
      where,
      relations: ["patient"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, hospitalId: string): Promise<LabOrder> {
    const order = await this.labOrderRepo.findOne({
      where: { id, hospitalId },
      relations: ["patient"],
    });
    if (!order) throw new NotFoundException(`Lab order ${id} not found`);
    return order;
  }

  async updateResult(id: string, hospitalId: string, dto: UpdateLabResultDto, actorId: string): Promise<LabOrder> {
    const order = await this.findOne(id, hospitalId);
    
    if (dto.result !== undefined) order.result = dto.result;
    if (dto.status !== undefined) order.status = dto.status;
    if (dto.criticalNotes !== undefined) order.criticalNotes = dto.criticalNotes;
    
    order.updatedBy = actorId;
    const saved = await this.labOrderRepo.save(order);

    if (dto.status === LabOrderStatus.RESULTED) {
      this.eventEmitter.emit("clinical.lab.resulted", {
        orderId: saved.id,
        patientId: saved.patientId,
        testName: saved.testName,
        result: saved.result,
        hospitalId,
        actorId,
      });
    }

    if (dto.status === LabOrderStatus.CRITICAL) {
      this.eventEmitter.emit("clinical.lab.critical", {
        orderId: saved.id,
        patientId: saved.patientId,
        testName: saved.testName,
        result: saved.result,
        hospitalId,
        actorId,
      });
    }

    return saved;
  }
}
