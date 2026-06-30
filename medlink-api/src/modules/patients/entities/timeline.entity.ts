import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { PatientEntity } from "./patient.entity";

@Entity("patient_timelines")
@Index(["hospitalId"])
@Index(["patientId"])
export class PatientTimeline extends TenantBaseEntity {
  @Column({ name: "patient_id", type: "uuid" })
  patientId!: string;

  @Column({ name: "event_type", type: "varchar", length: 100 })
  eventType!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any> | null;

  @ManyToOne(() => PatientEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity;
}
