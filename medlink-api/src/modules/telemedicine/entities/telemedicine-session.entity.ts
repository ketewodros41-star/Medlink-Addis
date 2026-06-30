import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { PatientEntity } from "../../patients/entities/patient.entity";

export enum TelemedicineStatus {
  SCHEDULED = "Scheduled",
  ACTIVE = "Active",
  COMPLETED = "Completed",
  ENDED = "Ended",
}

@Entity("telemedicine_sessions")
export class TelemedicineSession extends TenantBaseEntity {
  @Column({ name: "patient_id" })
  patientId!: string;

  @ManyToOne(() => PatientEntity)
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity;

  @Column({ type: "uuid" })
  doctorId!: string;

  @Column({ type: "enum", enum: TelemedicineStatus, default: TelemedicineStatus.SCHEDULED })
  status!: TelemedicineStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  roomUrl!: string | null;

  @Column({ type: "timestamp", nullable: true })
  startedAt!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  endedAt!: Date | null;
}
