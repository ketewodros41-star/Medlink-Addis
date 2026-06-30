import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../core/database/base.entity";

@Entity("knowledge_lab_tests")
@Index(["testName"], { unique: true })
export class KnowledgeLabTest extends BaseEntity {
  @Column({ name: "test_name", type: "varchar", length: 180 })
  testName!: string;

  @Column({ name: "alternative_names", type: "jsonb", default: () => "'[]'::jsonb" })
  alternativeNames!: string[];

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "specimen_type", type: "varchar", length: 120, nullable: true })
  specimenType!: string | null;

  @Column({ type: "text", nullable: true })
  preparation!: string | null;

  @Column({ name: "normal_reference_range", type: "text", nullable: true })
  normalReferenceRange!: string | null;

  @Column({ type: "varchar", length: 40, nullable: true })
  units!: string | null;

  @Column({ name: "clinical_interpretation", type: "text", nullable: true })
  clinicalInterpretation!: string | null;

  @Column({ name: "related_diseases", type: "jsonb", default: () => "'[]'::jsonb" })
  relatedDiseases!: string[];

  @Column({ name: "dataset_version", type: "varchar", length: 80, default: "starter-2026.06" })
  datasetVersion!: string;
}
