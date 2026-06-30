import { Column, Entity, Index } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";

@Entity("user_sessions")
@Index(["hospitalId", "userId"])
export class UserSessionEntity extends TenantBaseEntity {
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "device_id", type: "varchar", length: 120 })
  deviceId!: string;

  @Column({ name: "device_fingerprint", type: "varchar", length: 255, nullable: true })
  deviceFingerprint!: string | null;

  @Column({ name: "ip_address", type: "inet", nullable: true })
  ipAddress!: string | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent!: string | null;

  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;
}
