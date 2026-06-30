import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { PatientEntity } from "../../patients/entities/patient.entity";

export enum LabOrderStatus {
  PENDING = "Pending",
  COLLECTED = "Collected",
  PROCESSING = "Processing",
  RESULTED = "Resulted",
  CRITICAL = "Critical",
}

@Entity("lab_orders")
@Index(["hospitalId"])
@Index(["patientId"])
export class LabOrder extends TenantBaseEntity {
  @Column({ name: "patient_id", type: "uuid" })
  patientId!: string;

  @Column({ name: "doctor_id", type: "uuid" })
  doctorId!: string;

  @Column({ name: "encounter_id", type: "uuid", nullable: true })
  encounterId!: string | null;

  @Column({ name: "test_name", type: "varchar", length: 255 })
  testName!: string;

  @Column({
    type: "enum",
    enum: LabOrderStatus,
    default: LabOrderStatus.PENDING,
  })
  status!: LabOrderStatus;

  @Column({ type: "text", nullable: true })
  result!: string | null;

  @Column({ name: "critical_notes", type: "text", nullable: true })
  criticalNotes!: string | null;

  @ManyToOne(() => PatientEntity)
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity;
}
