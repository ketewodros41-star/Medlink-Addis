import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/types/jwt-payload.type";

@Controller("appointments")
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appointmentsService.create(user.hospital_id, dto, user.sub);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.appointmentsService.findAll(
      user.hospital_id,
      page ?? 1,
      limit ?? 20,
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.appointmentsService.findOne(id, user.hospital_id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appointmentsService.updateStatus(id, user.hospital_id, dto, user.sub);
  }
}
