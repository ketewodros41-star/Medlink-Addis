import { Column, Entity, Index } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";

export enum AppointmentStatus {
  SCHEDULED = "Scheduled",
  ARRIVED = "Arrived",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
  NO_SHOW = "No Show",
}

export enum AppointmentType {
  IN_PERSON = "In-Person",
  TELEMEDICINE = "Telemedicine",
}

@Entity("appointments")
@Index(["hospitalId"])
@Index(["patientId"])
@Index(["doctorId"])
@Index(["scheduledTime"])
export class Appointment extends TenantBaseEntity {
  @Column({ name: "patient_id", type: "uuid" })
  patientId!: string;

  @Column({ name: "doctor_id", type: "uuid" })
  doctorId!: string;

  @Column({ name: "scheduled_time", type: "timestamptz" })
  scheduledTime!: Date;

  @Column({ name: "duration_minutes", type: "int", default: 30 })
  durationMinutes!: number;

  @Column({
    type: "enum",
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status!: AppointmentStatus;

  @Column({
    type: "enum",
    enum: AppointmentType,
    default: AppointmentType.IN_PERSON,
  })
  type!: AppointmentType;

  @Column({ type: "text", nullable: true })
  notes!: string | null;
}
