import { Exclude } from "class-transformer";
import { Column, Entity, Index, JoinTable, ManyToMany } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { RoleEntity } from "./role.entity";

@Entity("users")
@Index(["hospitalId", "email"], { unique: true })
export class UserEntity extends TenantBaseEntity {
  @Column({ type: "varchar", length: 120 })
  email!: string;

  @Column({ name: "phone_number", type: "varchar", length: 40, nullable: true })
  phoneNumber!: string | null;

  @Column({ name: "first_name", type: "varchar", length: 80 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 80 })
  lastName!: string;

  @Exclude()
  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ name: "mfa_enabled", type: "boolean", default: false })
  mfaEnabled!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "last_login_at", type: "timestamptz", nullable: true })
  lastLoginAt!: Date | null;

  @ManyToMany(() => RoleEntity, role => role.users, { eager: true })
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "user_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
  })
  roles!: RoleEntity[];
}
