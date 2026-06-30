import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HospitalEntity } from "./entities/hospital.entity";

@Injectable()
export class HospitalsService {
  constructor(
    @InjectRepository(HospitalEntity)
    private readonly hospitalsRepository: Repository<HospitalEntity>,
  ) {}

  async findAllActive(): Promise<Pick<HospitalEntity, "id" | "name" | "code">[]> {
    const hospitals = await this.hospitalsRepository.find({
      where: { active: true },
      order: { name: "ASC" },
      select: ["id", "name", "code"],
    });
    return hospitals;
  }

  async findById(id: string): Promise<HospitalEntity | null> {
    return this.hospitalsRepository.findOne({ where: { id, active: true } });
  }
}
