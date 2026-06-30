import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { EmergencyService } from "./emergency.service";
import { CreateTriageEntryDto } from "./dto/create-triage-entry.dto";
import { UpdateTriageStatusDto } from "./dto/update-triage-status.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/types/jwt-payload.type";

@Controller("emergency")
@UseGuards(JwtAuthGuard)
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post("triage")
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTriageEntryDto) {
    return this.emergencyService.create(user.hospital_id, dto, user.sub);
  }

  @Get("triage")
  findAll(@CurrentUser() user: JwtPayload) {
    return this.emergencyService.findAll(user.hospital_id);
  }

  @Get("triage/:id")
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.emergencyService.findOne(id, user.hospital_id);
  }

  @Patch("triage/:id/status")
  updateStatus(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTriageStatusDto,
  ) {
    return this.emergencyService.updateStatus(id, user.hospital_id, dto, user.sub);
  }
}
