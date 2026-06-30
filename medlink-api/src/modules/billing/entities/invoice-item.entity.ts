import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { Invoice } from "./invoice.entity";

@Entity("invoice_items")
export class InvoiceItem extends TenantBaseEntity {
  @Column({ name: "invoice_id" })
  invoiceId!: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invoice_id" })
  invoice!: Invoice;

  @Column({ type: "varchar", length: 255 })
  description!: string;

  @Column({ type: "int", default: 1 })
  quantity!: number;

  @Column({ name: "unit_price", type: "decimal", precision: 12, scale: 2 })
  unitPrice!: number;

  @Column({ name: "tax_rate", type: "decimal", precision: 5, scale: 2, default: 0 })
  taxRate!: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total!: number;

  @Column({ name: "service_type", type: "varchar", length: 50, nullable: true })
  serviceType!: string;
}
