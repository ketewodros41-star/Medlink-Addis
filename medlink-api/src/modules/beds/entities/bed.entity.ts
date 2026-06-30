import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { Ward } from "./ward.entity";

@Entity("beds")
@Index(["hospitalId"])
export class Bed extends TenantBaseEntity {
  @Column({ name: "ward_id", type: "uuid" })
  wardId!: string;

  @Column({ name: "room_number", type: "varchar", length: 50 })
  roomNumber!: string;

  @Column({ name: "bed_number", type: "varchar", length: 50 })
  bedNumber!: string;

  @Column({ type: "varchar", length: 50, default: "Clean" })
  status!: string; // Clean, Occupied, Reserved, Dirty, Maintenance

  @ManyToOne(() => Ward, (ward) => ward.beds, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ward_id" })
  ward!: Ward;
}
