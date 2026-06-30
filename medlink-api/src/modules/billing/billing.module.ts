import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Invoice } from "./entities/invoice.entity";
import { InvoiceItem } from "./entities/invoice-item.entity";
import { Payment } from "./entities/payment.entity";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem, Payment])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class BillingModule {}
