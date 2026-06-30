import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { PatientQueryDto } from "./dto/patient-query.dto";
import { PatientEntity } from "./entities/patient.entity";
import { UpdatePatientDto } from "./dto/update-patient.dto";

type PaginatedPatients = {
  items: PatientEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientEntity)
    private readonly patients: Repository<PatientEntity>,
  ) {}

  async create(hospitalId: string, dto: CreatePatientDto, actorId: string): Promise<PatientEntity> {
    const patient = this.patients.create({
      hospitalId,
      mrn: await this.nextMrn(hospitalId),
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
      nationalId: dto.nationalId ?? null,
      passportNumber: dto.passportNumber ?? null,
      bloodType: dto.bloodType ?? null,
      primaryPhone: dto.primaryPhone ?? null,
      primaryEmail: dto.primaryEmail ?? null,
      allergies: [],
      medicalFlags: [],
      createdBy: actorId,
      updatedBy: actorId,
    });
    return this.patients.save(patient);
  }

  async list(hospitalId: string, query: PatientQueryDto): Promise<PaginatedPatients> {
    const where = query.q
      ? [
          { hospitalId, firstName: ILike(`%${query.q}%`) },
          { hospitalId, lastName: ILike(`%${query.q}%`) },
          { hospitalId, mrn: ILike(`%${query.q}%`) },
        ]
      : { hospitalId };

    const [items, total] = await this.patients.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findById(hospitalId: string, id: string): Promise<PatientEntity> {
    const patient = await this.patients.findOne({ where: { id, hospitalId } });
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  async update(hospitalId: string, id: string, dto: UpdatePatientDto, actorId: string): Promise<PatientEntity> {
    const patient = await this.findById(hospitalId, id);
    Object.assign(patient, { ...dto, updatedBy: actorId });
    return this.patients.save(patient);
  }

  private async nextMrn(hospitalId: string): Promise<string> {
    const count = await this.patients.count({ where: { hospitalId }, withDeleted: true });
    return `MRN-${String(count + 1).padStart(6, "0")}`;
  }
}
