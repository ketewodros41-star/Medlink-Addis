import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Ward } from "./entities/ward.entity";
import { Bed } from "./entities/bed.entity";
import { BedAdmission } from "./entities/bed-admission.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class BedsService {
  constructor(
    @InjectRepository(Ward)
    private readonly wardRepo: Repository<Ward>,
    @InjectRepository(Bed)
    private readonly bedRepo: Repository<Bed>,
    @InjectRepository(BedAdmission)
    private readonly admissionRepo: Repository<BedAdmission>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getWards(hospitalId: string): Promise<Ward[]> {
    let wards = await this.wardRepo.find({
      where: { hospitalId },
      relations: ["beds"],
    });

    // Seed default wards if empty
    if (wards.length === 0) {
      const defaultWards = [
        { name: "ICU", code: "ICU", color: "#f87171" },
        { name: "General Ward", code: "General", color: "#9fd8bd" },
        { name: "Maternity Ward", code: "Maternity", color: "#e2a356" },
        { name: "Pediatrics Ward", code: "Pediatrics", color: "#9fd8bd" },
        { name: "Surgery Ward", code: "Surgery", color: "#a3d1df" },
        { name: "Orthopedics Ward", code: "Orthopedics", color: "#a3d1df" },
      ];

      for (const dw of defaultWards) {
        const ward = this.wardRepo.create({ ...dw, hospitalId });
        await this.wardRepo.save(ward);
        
        // Seed 5 beds per ward
        for (let i = 1; i <= 5; i++) {
          const bed = this.bedRepo.create({
            hospitalId,
            wardId: ward.id,
            roomNumber: `Room ${String(100 + i)}`,
            bedNumber: `Bed ${String(i)}`,
            status: "Clean",
          });
          await this.bedRepo.save(bed);
        }
      }

      wards = await this.wardRepo.find({
        where: { hospitalId },
        relations: ["beds"],
      });
    }

    return wards;
  }

  async getBedAdmissions(hospitalId: string): Promise<BedAdmission[]> {
    return this.admissionRepo.find({
      where: { hospitalId, status: "Admitted" },
      relations: ["patient", "bed", "bed.ward"],
    });
  }

  async assignBed(
    hospitalId: string,
    patientId: string,
    bedId: string,
    actorId: string,
  ): Promise<BedAdmission> {
    const bed = await this.bedRepo.findOne({
      where: { id: bedId, hospitalId },
      relations: ["ward"],
    });
    if (!bed) throw new NotFoundException("Bed not found");
    if (bed.status === "Occupied") throw new BadRequestException("Bed is already occupied");

    // Close any previous active admission for this patient
    const activeAdmissions = await this.admissionRepo.find({
      where: { patientId, hospitalId, status: "Admitted" },
    });
    for (const active of activeAdmissions) {
      active.status = "Discharged";
      active.dischargedAt = new Date();
      active.updatedBy = actorId;
      await this.admissionRepo.save(active);

      // Reset previous bed status
      const prevBed = await this.bedRepo.findOne({ where: { id: active.bedId, hospitalId } });
      if (prevBed) {
        prevBed.status = "Clean";
        await this.bedRepo.save(prevBed);
      }
    }

    // Create admission record
    const admission = this.admissionRepo.create({
      hospitalId,
      patientId,
      bedId,
      status: "Admitted",
      createdBy: actorId,
      updatedBy: actorId,
    });
    const saved = await this.admissionRepo.save(admission);

    // Update bed status
    bed.status = "Occupied";
    await this.bedRepo.save(bed);

    // Emit event
    this.eventEmitter.emit("ward.bed.assigned", {
      patientId,
      hospitalId,
      bedId,
      wardName: bed.ward.name,
      roomNumber: bed.roomNumber,
      bedNumber: bed.bedNumber,
      admissionId: saved.id,
      actorId,
    });

    return saved;
  }

  async releaseBed(hospitalId: string, admissionId: string, actorId: string): Promise<BedAdmission> {
    const admission = await this.admissionRepo.findOne({
      where: { id: admissionId, hospitalId },
      relations: ["bed", "bed.ward"],
    });
    if (!admission) throw new NotFoundException("Admission record not found");

    admission.status = "Discharged";
    admission.dischargedAt = new Date();
    admission.updatedBy = actorId;
    const saved = await this.admissionRepo.save(admission);

    // Update bed status to Clean
    const bed = admission.bed;
    bed.status = "Clean";
    await this.bedRepo.save(bed);

    // Emit event
    this.eventEmitter.emit("ward.bed.released", {
      patientId: admission.patientId,
      hospitalId,
      bedId: bed.id,
      admissionId: saved.id,
      actorId,
    });

    return saved;
  }
}
