import { Column, Entity, Index, ManyToMany } from "typeorm";
import { BaseEntity } from "../../../core/database/base.entity";
import { RoleEntity } from "../../users/entities/role.entity";

@Entity("permissions")
export class PermissionEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "varchar", length: 120 })
  resource!: string;

  @Column({ type: "varchar", length: 80 })
  action!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @ManyToMany(() => RoleEntity, role => role.permissions)
  roles!: RoleEntity[];
}
