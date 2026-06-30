import { Column, Entity } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";

export enum InventoryItemStatus {
  OK = "OK",
  LOW = "Low",
  CRITICAL = "Critical",
}

@Entity("inventory_items")
export class InventoryItem extends TenantBaseEntity {
  @Column({ name: "drug_name", type: "varchar", length: 255 })
  drugName!: string;

  @Column({ type: "int", default: 0 })
  stock!: number;

  @Column({ name: "reorder_level", type: "int", default: 0 })
  reorderLevel!: number;

  @Column({ name: "expiry_date", type: "timestamp" })
  expiryDate!: Date;

  @Column({ type: "enum", enum: InventoryItemStatus, default: InventoryItemStatus.OK })
  status!: InventoryItemStatus;
}
