import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../core/database/base.entity";

@Entity("knowledge_guidelines")
@Index(["guidelineName", "contentVersion"], { unique: true })
export class KnowledgeGuideline extends BaseEntity {
  @Column({ name: "guideline_name", type: "varchar", length: 220 })
  guidelineName!: string;

  @Column({ type: "varchar", length: 120 })
  specialty!: string;

  @Column({ name: "clinical_scenario", type: "text" })
  clinicalScenario!: string;

  @Column({ name: "workflow_steps", type: "jsonb", default: () => "'[]'::jsonb" })
  workflowSteps!: string[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  references!: Array<{ title: string; url?: string; source?: string; publicationDate?: string }>;

  @Column({ name: "content_version", type: "varchar", length: 80 })
  contentVersion!: string;
}
