import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { PatientEntity } from "../../patients/entities/patient.entity";

export enum TriageStatus {
  WAITING = "Waiting",
  ASSESSMENT = "Assessment",
  TREATMENT = "Treatment",
  RESUSCITATION = "Resuscitation",
  DISCHARGED = "Discharged",
  ADMITTED = "Admitted",
}

@Entity("triage_entries")
@Index(["hospitalId"])
@Index(["patientId"])
export class TriageEntry extends TenantBaseEntity {
  @Column({ name: "patient_id", type: "uuid", nullable: true })
  patientId!: string | null;

  @Column({ name: "patient_name", type: "varchar", length: 255 })
  patientName!: string;

  @Column({ type: "integer" })
  age!: number;

  @Column({ type: "varchar", length: 50 })
  gender!: string;

  @Column({ type: "text" })
  complaint!: string;

  @Column({ type: "integer" })
  priority!: number; // 1 to 5

  @Column({ name: "priority_label", type: "varchar", length: 50 })
  priorityLabel!: string; // Immediate, Emergent, Urgent, etc.

  @Column({
    type: "enum",
    enum: TriageStatus,
    default: TriageStatus.WAITING,
  })
  status!: TriageStatus;

  @Column({ type: "varchar", length: 10 })
  color!: string;

  @Column({ name: "arrived_at", type: "timestamp with time zone", default: () => "CURRENT_TIMESTAMP" })
  arrivedAt!: Date;

  @ManyToOne(() => PatientEntity, { nullable: true })
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity | null;
}
