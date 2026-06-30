import { Column, Entity, Index } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";

export enum PatientGender {
  Female = "female",
  Male = "male",
  Other = "other",
  Unknown = "unknown",
}

@Entity("patients")
@Index(["hospitalId", "mrn"], { unique: true })
@Index(["hospitalId", "nationalId"], { unique: true, where: "national_id IS NOT NULL" })
export class PatientEntity extends TenantBaseEntity {
  @Column({ type: "varchar", length: 40 })
  mrn!: string;

  @Column({ name: "national_id", type: "varchar", length: 80, nullable: true })
  nationalId!: string | null;

  @Column({ name: "passport_number", type: "varchar", length: 80, nullable: true })
  passportNumber!: string | null;

  @Column({ name: "first_name", type: "varchar", length: 80 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 80 })
  lastName!: string;

  @Column({ name: "date_of_birth", type: "date" })
  dateOfBirth!: string;

  @Column({ type: "enum", enum: PatientGender, default: PatientGender.Unknown })
  gender!: PatientGender;

  @Column({ name: "blood_type", type: "varchar", length: 8, nullable: true })
  bloodType!: string | null;

  @Column({ name: "primary_phone", type: "varchar", length: 40, nullable: true })
  primaryPhone!: string | null;

  @Column({ name: "primary_email", type: "varchar", length: 120, nullable: true })
  primaryEmail!: string | null;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  allergies!: Array<{
    substance: string;
    severity: "low" | "moderate" | "high" | "critical";
    reaction?: string;
  }>;

  @Column({ name: "medical_flags", type: "jsonb", default: () => "'[]'::jsonb" })
  medicalFlags!: Array<{
    type: string;
    priority: "low" | "medium" | "high";
    note?: string;
  }>;

  @Column({ name: "search_vector", type: "tsvector", nullable: true, select: false })
  searchVector!: string | null;
}
