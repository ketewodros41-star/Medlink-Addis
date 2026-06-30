import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity("clinical_diseases")
export class ClinicalDisease {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  name!: string;

  @Column({ name: "icd10_code", type: "varchar", length: 50 })
  icd10Code!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "jsonb", default: "[]" })
  symptoms!: string[];

  @Column({ type: "jsonb", default: "[]" })
  signs!: string[];

  @Column({ type: "jsonb", default: "[]" })
  investigations!: string[];

  @Column({ type: "jsonb", default: "[]" })
  treatments!: string[];

  @Column({ name: "red_flags", type: "jsonb", default: "[]" })
  redFlags!: string[];

  @Column({ type: "jsonb", default: "[]" })
  differentials!: string[];

  @Column({ name: "evidence_level", type: "varchar", length: 50, default: "High" })
  evidenceLevel!: string;

  @Column({ name: "last_reviewed", type: "date", default: () => "CURRENT_DATE" })
  lastReviewed!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp with time zone", nullable: true })
  deletedAt!: Date | null;
}
