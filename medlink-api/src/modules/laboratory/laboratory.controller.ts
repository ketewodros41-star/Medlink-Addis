import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { LaboratoryService } from "./laboratory.service";
import { CreateLabOrderDto } from "./dto/create-lab-order.dto";
import { UpdateLabResultDto } from "./dto/update-lab-result.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/types/jwt-payload.type";
import { LabOrderStatus } from "./entities/lab-order.entity";

@Controller("laboratory")
@UseGuards(JwtAuthGuard)
export class LaboratoryController {
  constructor(private readonly labService: LaboratoryService) {}

  @Post("orders")
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLabOrderDto) {
    return this.labService.create(user.hospital_id, dto, user.sub);
  }

  @Get("orders")
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query("patientId") patientId?: string,
    @Query("status") status?: LabOrderStatus,
  ) {
    return this.labService.findAll(user.hospital_id, { patientId, status });
  }

  @Get("orders/:id")
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.labService.findOne(id, user.hospital_id);
  }

  @Patch("orders/:id/result")
  updateResult(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateLabResultDto,
  ) {
    return this.labService.updateResult(id, user.hospital_id, dto, user.sub);
  }
}
