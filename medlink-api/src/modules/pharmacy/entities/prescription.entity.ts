import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { PatientEntity } from "../../patients/entities/patient.entity";

export enum PrescriptionStatus {
  PENDING = "Pending",
  READY = "Ready",
  HOLD = "Hold",
  DISPENSED = "Dispensed",
}

@Entity("prescriptions")
// Composite unique: rx numbers unique per hospital, not globally
@Index(["hospitalId", "rxNumber"], { unique: true })
export class Prescription extends TenantBaseEntity {
  @Column({ name: "rx_number", type: "varchar", length: 50 })
  rxNumber!: string;

  @Column({ name: "patient_id" })
  patientId!: string;

  @ManyToOne(() => PatientEntity)
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity;

  @Column({ name: "drug_name", type: "varchar", length: 255 })
  drugName!: string;

  @Column({ type: "varchar", length: 255 })
  sig!: string;

  @Column({ type: "int", default: 1 })
  qty!: number;

  @Column({ name: "prescriber_name", type: "varchar", length: 100 })
  prescriberName!: string;

  @Column({ type: "enum", enum: PrescriptionStatus, default: PrescriptionStatus.PENDING })
  status!: PrescriptionStatus;

  @Column({ name: "interaction_alert", type: "boolean", default: false })
  interactionAlert!: boolean;

  @Column({ name: "interaction_details", type: "text", nullable: true })
  interactionDetails!: string | null;
}
