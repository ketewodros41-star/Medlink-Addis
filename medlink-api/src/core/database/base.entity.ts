import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
  Column,
} from "typeorm";

export abstract class BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy!: string | null;

  @Column({ name: "updated_by", type: "uuid", nullable: true })
  updatedBy!: string | null;

  @VersionColumn()
  version!: number;
}

export abstract class TenantBaseEntity extends BaseEntity {
  @Column({ name: "hospital_id", type: "uuid" })
  hospitalId!: string;
}
