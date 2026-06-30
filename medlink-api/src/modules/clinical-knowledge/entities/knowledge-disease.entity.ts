import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../core/database/base.entity";

@Entity("knowledge_diseases")
@Index(["icd10Code"], { unique: true })
export class KnowledgeDisease extends BaseEntity {
  @Column({ name: "icd10_code", type: "varchar", length: 40 })
  icd10Code!: string;

  @Column({ type: "varchar", length: 220 })
  name!: string;

  @Column({ name: "alternative_names", type: "jsonb", default: () => "'[]'::jsonb" })
  alternativeNames!: string[];

  @Column({ name: "body_system", type: "varchar", length: 120 })
  bodySystem!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text", nullable: true })
  epidemiology!: string | null;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  causes!: string[];

  @Column({ name: "risk_factors", type: "jsonb", default: () => "'[]'::jsonb" })
  riskFactors!: string[];

  @Column({ name: "clinical_presentation", type: "text", nullable: true })
  clinicalPresentation!: string | null;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  symptoms!: string[];

  @Column({ name: "physical_signs", type: "jsonb", default: () => "'[]'::jsonb" })
  physicalSigns!: string[];

  @Column({ name: "differential_diagnoses", type: "jsonb", default: () => "'[]'::jsonb" })
  differentialDiagnoses!: string[];

  @Column({ name: "recommended_investigations", type: "jsonb", default: () => "'[]'::jsonb" })
  recommendedInvestigations!: string[];

  @Column({ name: "laboratory_findings", type: "jsonb", default: () => "'[]'::jsonb" })
  laboratoryFindings!: string[];

  @Column({ name: "imaging_findings", type: "jsonb", default: () => "'[]'::jsonb" })
  imagingFindings!: string[];

  @Column({ name: "first_line_treatment", type: "jsonb", default: () => "'[]'::jsonb" })
  firstLineTreatment!: string[];

  @Column({ name: "alternative_treatment", type: "jsonb", default: () => "'[]'::jsonb" })
  alternativeTreatment!: string[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  complications!: string[];

  @Column({ name: "emergency_red_flags", type: "jsonb", default: () => "'[]'::jsonb" })
  emergencyRedFlags!: string[];

  @Column({ name: "follow_up_recommendations", type: "jsonb", default: () => "'[]'::jsonb" })
  followUpRecommendations!: string[];

  @Column({ name: "patient_education", type: "text", nullable: true })
  patientEducation!: string | null;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  references!: Array<{ title: string; url?: string; source?: string; publicationDate?: string }>;

  @Column({ name: "evidence_level", type: "varchar", length: 40, default: "moderate" })
  evidenceLevel!: string;

  @Column({ name: "last_reviewed", type: "date", nullable: true })
  lastReviewed!: string | null;

  @Column({ name: "dataset_version", type: "varchar", length: 80, default: "starter-2026.06" })
  datasetVersion!: string;
}
