import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../core/database/base.entity";

@Entity("knowledge_imaging_studies")
@Index(["studyName"], { unique: true })
export class KnowledgeImagingStudy extends BaseEntity {
  @Column({ name: "study_name", type: "varchar", length: 180 })
  studyName!: string;

  @Column({ type: "varchar", length: 80 })
  modality!: string;

  @Column({ name: "clinical_indications", type: "jsonb", default: () => "'[]'::jsonb" })
  clinicalIndications!: string[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  contraindications!: string[];

  @Column({ name: "typical_findings", type: "jsonb", default: () => "'[]'::jsonb" })
  typicalFindings!: string[];

  @Column({ type: "text", nullable: true })
  preparation!: string | null;

  @Column({ name: "related_diseases", type: "jsonb", default: () => "'[]'::jsonb" })
  relatedDiseases!: string[];

  @Column({ name: "dataset_version", type: "varchar", length: 80, default: "starter-2026.06" })
  datasetVersion!: string;
}
