import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/types/jwt-payload.type";
import { PaymentMethod } from "./entities/payment.entity";

@Controller("invoices")
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    const invoices = await this.invoicesService.findAll(user.hospital_id);
    return { data: invoices };
  }

  @Get('metrics')
  async getMetrics(@CurrentUser() user: JwtPayload) {
    const metrics = await this.invoicesService.getRevenueMetrics(user.hospital_id);
    return { data: metrics };
  }

  @Post()
  async createInvoice(
    @CurrentUser() user: JwtPayload,
    @Body() dto: {
      patientId: string;
      dueDate?: string;
      items: Array<{ description: string; quantity: number; unitPrice: number; serviceType?: string }>;
    },
  ) {
    return this.invoicesService.createInvoice(user.hospital_id, dto, user.sub);
  }

  @Post(":id/payments")
  async recordPayment(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: { amount: number; method: PaymentMethod; referenceNumber?: string },
  ) {
    return this.invoicesService.recordPayment(id, user.hospital_id, dto, user.sub);
  }
}
