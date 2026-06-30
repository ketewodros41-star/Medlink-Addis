import { Column, Entity, Index, OneToMany } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { Bed } from "./bed.entity";

@Entity("wards")
@Index(["hospitalId"])
export class Ward extends TenantBaseEntity {
  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 50 })
  code!: string;

  @Column({ type: "varchar", length: 20 })
  color!: string;

  @OneToMany(() => Bed, (bed) => bed.ward)
  beds!: Bed[];
}
