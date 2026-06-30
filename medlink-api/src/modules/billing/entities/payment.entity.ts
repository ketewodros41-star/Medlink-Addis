import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { Invoice } from "./invoice.entity";

export enum PaymentMethod {
  CASH = "Cash",
  CARD = "Card",
  MOBILE = "Mobile Money",
  BANK = "Bank Transfer",
  INSURANCE = "Insurance",
}

@Entity("payments")
export class Payment extends TenantBaseEntity {
  @Column({ name: "invoice_id" })
  invoiceId!: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invoice_id" })
  invoice!: Invoice;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: "enum", enum: PaymentMethod })
  method!: PaymentMethod;

  @Column({ name: "reference_number", type: "varchar", length: 100, nullable: true })
  referenceNumber!: string;

  @Column({ name: "payment_date", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  paymentDate!: Date;
}
