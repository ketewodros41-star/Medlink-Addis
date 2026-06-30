import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { PatientEntity } from "../../patients/entities/patient.entity";

@Entity("queue_entries")
@Index(["hospitalId"])
export class QueueEntry extends TenantBaseEntity {
  @Column({ name: "patient_id", type: "uuid" })
  patientId!: string;

  @Column({ name: "queue_number", type: "varchar", length: 20 })
  queueNumber!: string;

  @Column({ name: "current_dept", type: "varchar", length: 100 })
  currentDept!: string;

  @Column({ type: "varchar", length: 50, default: "Waiting" })
  status!: string; // Waiting, Called, Processing, Completed

  @Column({ name: "estimated_wait_mins", type: "integer", default: 15 })
  estimatedWaitMins!: number;

  @Column({ name: "called_at", type: "timestamp with time zone", nullable: true })
  calledAt!: Date | null;

  @ManyToOne(() => PatientEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity;
}
