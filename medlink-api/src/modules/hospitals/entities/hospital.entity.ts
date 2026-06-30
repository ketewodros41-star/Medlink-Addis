import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../core/database/base.entity";

@Entity("hospitals")
export class HospitalEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 80 })
  code!: string;

  @Column({ name: "default_currency", type: "char", length: 3, default: "ETB" })
  defaultCurrency!: string;

  @Column({ type: "boolean", default: true })
  active!: boolean;
}
