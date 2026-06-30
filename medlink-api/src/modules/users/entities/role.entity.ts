import { Column, Entity, Index, JoinTable, ManyToMany } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { PermissionEntity } from "../../permissions/entities/permission.entity";
import { UserEntity } from "./user.entity";

@Entity("roles")
@Index(["hospitalId", "name"], { unique: true })
export class RoleEntity extends TenantBaseEntity {
  @Column({ type: "varchar", length: 80 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "is_system_role", type: "boolean", default: false })
  isSystemRole!: boolean;

  @ManyToMany(() => PermissionEntity, permission => permission.roles, { eager: true })
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
  })
  permissions!: PermissionEntity[];

  @ManyToMany(() => UserEntity, user => user.roles)
  users!: UserEntity[];
}
