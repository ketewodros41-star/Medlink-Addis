import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Invoice, InvoiceStatus } from "./entities/invoice.entity";
import { InvoiceItem } from "./entities/invoice-item.entity";
import { Payment, PaymentMethod } from "./entities/payment.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";

export interface RevenueMetrics {
  totalRevenue: number;
  outstanding: number;
  invoicesCount: number;
  paidCount: number;
  overdueCount: number;
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(InvoiceItem)
    private readonly itemRepo: Repository<InvoiceItem>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(hospitalId: string) {
    return this.invoiceRepo.find({
      where: { hospitalId },
      relations: ["patient", "items", "payments"],
      order: { createdAt: "DESC" },
    });
  }

  async getRevenueMetrics(hospitalId: string): Promise<RevenueMetrics> {
    const raw = await this.invoiceRepo
      .createQueryBuilder("inv")
      .select("COALESCE(SUM(inv.amountPaid), 0)", "totalRevenue")
      .addSelect(
        "COALESCE(SUM(inv.grandTotal - inv.amountPaid), 0)",
        "outstanding",
      )
      .addSelect("COUNT(*)", "invoicesCount")
      .addSelect(
        "SUM(CASE WHEN inv.status = 'Paid' THEN 1 ELSE 0 END)",
        "paidCount",
      )
      .addSelect(
        "SUM(CASE WHEN inv.dueDate < NOW() AND inv.status NOT IN ('Paid','Void') THEN 1 ELSE 0 END)",
        "overdueCount",
      )
      .where("inv.hospitalId = :hospitalId", { hospitalId })
      .andWhere("inv.deletedAt IS NULL")
      .getRawOne<{
        totalRevenue: string;
        outstanding: string;
        invoicesCount: string;
        paidCount: string;
        overdueCount: string;
      }>();

    return {
      totalRevenue: parseFloat(raw?.totalRevenue ?? "0"),
      outstanding: parseFloat(raw?.outstanding ?? "0"),
      invoicesCount: parseInt(raw?.invoicesCount ?? "0", 10),
      paidCount: parseInt(raw?.paidCount ?? "0", 10),
      overdueCount: parseInt(raw?.overdueCount ?? "0", 10),
    };
  }

  async createInvoice(
    hospitalId: string,
    dto: {
      patientId: string;
      dueDate?: string;
      items: Array<{ description: string; quantity: number; unitPrice: number; serviceType?: string }>;
    },
    actorId: string,
  ): Promise<Invoice> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const count = await this.invoiceRepo.count({ where: { hospitalId } });
      const invoiceNumber = `INV-${String(1001 + count)}`;

      // Calculate totals
      let subtotal = 0;
      for (const line of dto.items) {
        subtotal += line.quantity * line.unitPrice;
      }
      const taxTotal = subtotal * 0.15; // 15% standard tax
      const grandTotal = subtotal + taxTotal;

      const invoice = this.invoiceRepo.create({
        hospitalId,
        patientId: dto.patientId,
        invoiceNumber,
        status: InvoiceStatus.UNPAID,
        subtotal,
        taxTotal,
        discountTotal: 0,
        grandTotal,
        amountPaid: 0,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdBy: actorId,
        updatedBy: actorId,
      });

      const savedInvoice = await queryRunner.manager.save(Invoice, invoice);

      // Create line items
      const itemsToSave = dto.items.map((line) => {
        const itemTotal = line.quantity * line.unitPrice * 1.15;
        return this.itemRepo.create({
          hospitalId,
          invoiceId: savedInvoice.id,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: 15,
          total: itemTotal,
          serviceType: line.serviceType || "General Service",
          createdBy: actorId,
          updatedBy: actorId,
        });
      });

      await queryRunner.manager.save(InvoiceItem, itemsToSave);

      await queryRunner.commitTransaction();

      // Emit event
      this.eventEmitter.emit("billing.invoice.generated", {
        invoiceId: savedInvoice.id,
        patientId: savedInvoice.patientId,
        invoiceNumber: savedInvoice.invoiceNumber,
        totalAmount: savedInvoice.grandTotal,
        hospitalId,
        actorId,
      });

      return savedInvoice;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async recordPayment(
    invoiceId: string,
    hospitalId: string,
    dto: { amount: number; method: PaymentMethod; referenceNumber?: string },
    actorId: string,
  ): Promise<Payment> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, hospitalId },
      relations: ["payments"],
    });

    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException("Invoice is already fully paid");
    }

    const newAmountPaid = Number(invoice.amountPaid) + Number(dto.amount);
    if (newAmountPaid > Number(invoice.grandTotal)) {
      throw new BadRequestException(`Payment exceeds invoice total of ETB ${invoice.grandTotal}`);
    }

    // Save payment
    const payment = this.paymentRepo.create({
      hospitalId,
      invoiceId,
      amount: dto.amount,
      method: dto.method,
      referenceNumber: dto.referenceNumber,
      createdBy: actorId,
      updatedBy: actorId,
    });
    const savedPayment = await this.paymentRepo.save(payment);

    // Update invoice
    invoice.amountPaid = newAmountPaid;
    if (newAmountPaid >= invoice.grandTotal) {
      invoice.status = InvoiceStatus.PAID;
    } else {
      invoice.status = InvoiceStatus.PARTIAL;
    }
    invoice.updatedBy = actorId;
    await this.invoiceRepo.save(invoice);

    // Emit event
    this.eventEmitter.emit("billing.payment.completed", {
      paymentId: savedPayment.id,
      invoiceId: invoice.id,
      patientId: invoice.patientId,
      amountPaid: dto.amount,
      paymentMethod: dto.method,
      hospitalId,
      actorId,
    });

    return savedPayment;
  }
}
