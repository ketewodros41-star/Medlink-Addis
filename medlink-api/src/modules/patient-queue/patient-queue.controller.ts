import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PatientQueueService } from "./patient-queue.service";
import { CreateQueueEntryDto } from "./dto/create-queue-entry.dto";
import { UpdateQueueStatusDto } from "./dto/update-queue-status.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/types/jwt-payload.type";

@Controller("patient-queue")
@UseGuards(JwtAuthGuard)
export class PatientQueueController {
  constructor(private readonly queueService: PatientQueueService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateQueueEntryDto) {
    return this.queueService.create(user.hospital_id, dto, user.sub);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query("currentDept") currentDept?: string,
  ) {
    return this.queueService.findAll(user.hospital_id, currentDept);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.queueService.findOne(id, user.hospital_id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateQueueStatusDto,
  ) {
    return this.queueService.updateStatus(id, user.hospital_id, dto, user.sub);
  }
}
