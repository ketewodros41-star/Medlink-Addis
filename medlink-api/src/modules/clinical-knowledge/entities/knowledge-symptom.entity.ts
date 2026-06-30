import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../core/database/base.entity";

@Entity("knowledge_symptoms")
@Index(["name"], { unique: true })
export class KnowledgeSymptom extends BaseEntity {
  @Column({ type: "varchar", length: 180 })
  name!: string;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  synonyms!: string[];

  @Column({ name: "body_system", type: "varchar", length: 120 })
  bodySystem!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "common_causes", type: "jsonb", default: () => "'[]'::jsonb" })
  commonCauses!: string[];

  @Column({ name: "emergency_causes", type: "jsonb", default: () => "'[]'::jsonb" })
  emergencyCauses!: string[];

  @Column({ name: "associated_diseases", type: "jsonb", default: () => "'[]'::jsonb" })
  associatedDiseases!: string[];

  @Column({ name: "related_symptoms", type: "jsonb", default: () => "'[]'::jsonb" })
  relatedSymptoms!: string[];

  @Column({ name: "dataset_version", type: "varchar", length: 80, default: "starter-2026.06" })
  datasetVersion!: string;
}
