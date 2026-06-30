import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { BedsService } from "./beds.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/types/jwt-payload.type";

@Controller("beds")
@UseGuards(JwtAuthGuard)
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Get("wards")
  getWards(@CurrentUser() user: JwtPayload) {
    return this.bedsService.getWards(user.hospital_id);
  }

  @Get("admissions")
  getAdmissions(@CurrentUser() user: JwtPayload) {
    return this.bedsService.getBedAdmissions(user.hospital_id);
  }

  @Post("assign")
  assignBed(
    @CurrentUser() user: JwtPayload,
    @Body("patientId") patientId: string,
    @Body("bedId") bedId: string,
  ) {
    return this.bedsService.assignBed(user.hospital_id, patientId, bedId, user.sub);
  }

  @Post("admissions/:id/release")
  releaseBed(
    @CurrentUser() user: JwtPayload,
    @Param("id") admissionId: string,
  ) {
    return this.bedsService.releaseBed(user.hospital_id, admissionId, user.sub);
  }
}
