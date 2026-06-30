import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { PatientEntity } from "../../patients/entities/patient.entity";
import { Bed } from "./bed.entity";

@Entity("bed_admissions")
@Index(["hospitalId"])
export class BedAdmission extends TenantBaseEntity {
  @Column({ name: "patient_id", type: "uuid" })
  patientId!: string;

  @Column({ name: "bed_id", type: "uuid" })
  bedId!: string;

  @Column({ name: "admitted_at", type: "timestamp with time zone", default: () => "CURRENT_TIMESTAMP" })
  admittedAt!: Date;

  @Column({ name: "discharged_at", type: "timestamp with time zone", nullable: true })
  dischargedAt!: Date | null;

  @Column({ type: "varchar", length: 50, default: "Admitted" })
  status!: string; // Admitted, Discharged

  @ManyToOne(() => PatientEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity;

  @ManyToOne(() => Bed, { onDelete: "CASCADE" })
  @JoinColumn({ name: "bed_id" })
  bed!: Bed;
}
