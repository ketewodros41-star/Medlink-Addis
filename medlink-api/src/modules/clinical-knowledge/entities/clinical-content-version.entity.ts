import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../core/database/base.entity";

@Entity("clinical_content_versions")
@Index(["dataset", "versionLabel"], { unique: true })
export class ClinicalContentVersion extends BaseEntity {
  @Column({ type: "varchar", length: 80 })
  dataset!: string;

  @Column({ name: "version_label", type: "varchar", length: 80 })
  versionLabel!: string;

  @Column({ name: "source_name", type: "varchar", length: 180 })
  sourceName!: string;

  @Column({ name: "source_url", type: "text", nullable: true })
  sourceUrl!: string | null;

  @Column({ name: "published_at", type: "date", nullable: true })
  publishedAt!: string | null;

  @Column({ name: "imported_at", type: "timestamptz", default: () => "now()" })
  importedAt!: Date;

  @Column({ type: "varchar", length: 30, default: "draft" })
  status!: "draft" | "published" | "retired";
}
