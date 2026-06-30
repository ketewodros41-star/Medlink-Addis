import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Appointment, AppointmentStatus } from "./entities/appointment.entity";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";

type PaginatedAppointments = {
  items: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    hospitalId: string,
    dto: CreateAppointmentDto,
    actorId: string,
  ): Promise<Appointment> {
    const appointment = this.appointmentsRepository.create({
      ...dto,
      hospitalId,
      createdBy: actorId,
      updatedBy: actorId,
      scheduledTime: new Date(dto.scheduledTime),
    });
    await this.appointmentsRepository.save(appointment);

    this.eventEmitter.emit("appointment.scheduled", {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      hospitalId,
    });

    return appointment;
  }

  async findAll(
    hospitalId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedAppointments> {
    const [items, total] = await this.appointmentsRepository.findAndCount({
      where: { hospitalId },
      order: { scheduledTime: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, hospitalId: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id, hospitalId },
    });
    if (!appointment) throw new NotFoundException("Appointment not found");
    return appointment;
  }

  async updateStatus(
    id: string,
    hospitalId: string,
    dto: UpdateAppointmentStatusDto,
    actorId: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id, hospitalId);
    appointment.status = dto.status;
    appointment.updatedBy = actorId;
    await this.appointmentsRepository.save(appointment);

    if (dto.status === AppointmentStatus.ARRIVED) {
      this.eventEmitter.emit("appointment.arrived", {
        appointmentId: appointment.id,
        hospitalId,
      });
    }

    if (dto.status === AppointmentStatus.COMPLETED) {
      this.eventEmitter.emit("appointment.completed", {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        hospitalId,
      });
    }

    return appointment;
  }
}
