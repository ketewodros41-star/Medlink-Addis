import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PharmacyService } from "./pharmacy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/types/jwt-payload.type";

@Controller("pharmacy")
@UseGuards(JwtAuthGuard)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Get("prescriptions")
  async listPrescriptions(@CurrentUser() user: JwtPayload) {
    const rx = await this.pharmacyService.findAllPrescriptions(user.hospital_id);
    return { data: rx };
  }

  @Get("inventory")
  async listInventory(@CurrentUser() user: JwtPayload) {
    const items = await this.pharmacyService.findAllInventory(user.hospital_id);
    return { data: items };
  }

  @Get("alerts")
  async getAlerts(@CurrentUser() user: JwtPayload) {
    const alerts = await this.pharmacyService.getAlerts(user.hospital_id);
    return { data: alerts };
  }

  @Patch("prescriptions/:id/dispense")
  async dispensePrescription(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.pharmacyService.dispensePrescription(id, user.hospital_id, user.sub);
  }

  @Post("inventory/:id/restock")
  async restockInventory(
    @Param("id") id: string,
    @Body("qty") qty: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.pharmacyService.restockInventory(id, qty, user.hospital_id, user.sub);
  }

  @Post("inventory/add-item")
  async addInventoryItem(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { drugName: string; stock: number; reorderLevel: number; expiryDate: string },
  ) {
    return this.pharmacyService.addInventoryItem(user.hospital_id, dto);
  }
}
