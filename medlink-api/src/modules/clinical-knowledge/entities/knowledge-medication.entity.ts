import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../core/database/base.entity";

@Entity("knowledge_medications")
@Index(["genericName"], { unique: true })
export class KnowledgeMedication extends BaseEntity {
  @Column({ name: "generic_name", type: "varchar", length: 180 })
  genericName!: string;

  @Column({ name: "brand_names", type: "jsonb", default: () => "'[]'::jsonb" })
  brandNames!: string[];

  @Column({ name: "drug_class", type: "varchar", length: 160 })
  drugClass!: string;

  @Column({ name: "therapeutic_category", type: "varchar", length: 160 })
  therapeuticCategory!: string;

  @Column({ name: "dosage_forms", type: "jsonb", default: () => "'[]'::jsonb" })
  dosageForms!: string[];

  @Column({ name: "adult_dosing", type: "text", nullable: true })
  adultDosing!: string | null;

  @Column({ name: "pediatric_dosing", type: "text", nullable: true })
  pediatricDosing!: string | null;

  @Column({ name: "pregnancy_category", type: "varchar", length: 80, nullable: true })
  pregnancyCategory!: string | null;

  @Column({ name: "lactation_information", type: "text", nullable: true })
  lactationInformation!: string | null;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  contraindications!: string[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  precautions!: string[];

  @Column({ name: "side_effects", type: "jsonb", default: () => "'[]'::jsonb" })
  sideEffects!: string[];

  @Column({ name: "drug_interactions", type: "jsonb", default: () => "'[]'::jsonb" })
  drugInteractions!: string[];

  @Column({ name: "monitoring_requirements", type: "jsonb", default: () => "'[]'::jsonb" })
  monitoringRequirements!: string[];

  @Column({ name: "renal_dose_adjustment", type: "text", nullable: true })
  renalDoseAdjustment!: string | null;

  @Column({ name: "hepatic_dose_adjustment", type: "text", nullable: true })
  hepaticDoseAdjustment!: string | null;

  @Column({ name: "storage_conditions", type: "text", nullable: true })
  storageConditions!: string | null;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  references!: Array<{ title: string; url?: string; source?: string; publicationDate?: string }>;

  @Column({ name: "dataset_version", type: "varchar", length: 80, default: "starter-2026.06" })
  datasetVersion!: string;
}
