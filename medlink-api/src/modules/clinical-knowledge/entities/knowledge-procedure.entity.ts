import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../core/database/base.entity";

@Entity("knowledge_procedures")
@Index(["procedureName"], { unique: true })
export class KnowledgeProcedure extends BaseEntity {
  @Column({ name: "procedure_name", type: "varchar", length: 180 })
  procedureName!: string;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  indications!: string[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  contraindications!: string[];

  @Column({ name: "required_equipment", type: "jsonb", default: () => "'[]'::jsonb" })
  requiredEquipment!: string[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  complications!: string[];

  @Column({ type: "text", nullable: true })
  aftercare!: string | null;

  @Column({ name: "dataset_version", type: "varchar", length: 80, default: "starter-2026.06" })
  datasetVersion!: string;
}
