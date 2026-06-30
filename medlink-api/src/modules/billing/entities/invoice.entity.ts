import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { PatientEntity } from "../../patients/entities/patient.entity";
import { InvoiceItem } from "./invoice-item.entity";
import { Payment } from "./payment.entity";

export enum InvoiceStatus {
  DRAFT = "Draft",
  UNPAID = "Unpaid",
  PARTIAL = "Partial",
  PAID = "Paid",
  INSURANCE = "Insurance",
  VOID = "Void",
}

@Entity("invoices")
// Composite unique index: invoice numbers must be unique per hospital, not globally
@Index(["hospitalId", "invoiceNumber"], { unique: true })
export class Invoice extends TenantBaseEntity {
  @Column({ name: "patient_id" })
  patientId!: string;

  @ManyToOne(() => PatientEntity)
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity;

  @Column({ name: "invoice_number", type: "varchar", length: 50 })
  invoiceNumber!: string;

  @Column({ type: "enum", enum: InvoiceStatus, default: InvoiceStatus.UNPAID })
  status!: InvoiceStatus;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ name: "tax_total", type: "decimal", precision: 12, scale: 2, default: 0 })
  taxTotal!: number;

  @Column({ name: "discount_total", type: "decimal", precision: 12, scale: 2, default: 0 })
  discountTotal!: number;

  @Column({ name: "grand_total", type: "decimal", precision: 12, scale: 2, default: 0 })
  grandTotal!: number;

  @Column({ name: "amount_paid", type: "decimal", precision: 12, scale: 2, default: 0 })
  amountPaid!: number;

  @Column({ name: "due_date", type: "timestamptz", nullable: true })
  dueDate!: Date | null;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items!: InvoiceItem[];

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments!: Payment[];
}
