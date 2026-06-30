import { Column, Entity, Index, JoinColumn, OneToOne, ManyToOne } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { VitalSigns } from "./vital-signs.entity";
import { SoapNote } from "./soap-note.entity";
import { PatientEntity } from "../../patients/entities/patient.entity";

export enum EncounterStatus {
  IN_PROGRESS = "In Progress",
  SIGNED = "Signed",
  AMENDED = "Amended",
}

@Entity("encounters")
@Index(["hospitalId"])
@Index(["patientId"])
@Index(["appointmentId"])
export class Encounter extends TenantBaseEntity {
  @Column({ name: "patient_id", type: "uuid" })
  patientId!: string;

  @ManyToOne(() => PatientEntity)
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity;

  @Column({ name: "doctor_id", type: "uuid" })
  doctorId!: string;


  @Column({ name: "appointment_id", type: "uuid", nullable: true })
  appointmentId!: string | null;

  @Column({ name: "chief_complaint", type: "text", nullable: true })
  chiefComplaint!: string | null;

  @Column({
    type: "enum",
    enum: EncounterStatus,
    default: EncounterStatus.IN_PROGRESS,
  })
  status!: EncounterStatus;

  @OneToOne(() => VitalSigns, (vitals) => vitals.encounter, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  vitalSigns!: VitalSigns | null;

  @OneToOne(() => SoapNote, (note) => note.encounter, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  soapNote!: SoapNote | null;
}
