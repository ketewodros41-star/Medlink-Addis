import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { PatientQueryDto } from "./dto/patient-query.dto";
import { PatientResponseDto } from "./dto/patient-response.dto";
import { PatientsService } from "./patients.service";
import { TimelineService } from "./timeline.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/types/jwt-payload.type";

@Controller("patients")
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(
    private readonly patients: PatientsService,
    private readonly timeline: TimelineService,
  ) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query() query: PatientQueryDto) {
    const result = await this.patients.list(user.hospital_id, query);
    return {
      data: plainToInstance(PatientResponseDto, result.items, { excludeExtraneousValues: true }),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePatientDto): Promise<PatientResponseDto> {
    const patient = await this.patients.create(user.hospital_id, dto, user.sub);
    return plainToInstance(PatientResponseDto, patient, { excludeExtraneousValues: true });
  }

  @Get(":id")
  async findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string): Promise<PatientResponseDto> {
    const patient = await this.patients.findById(user.hospital_id, id);
    return plainToInstance(PatientResponseDto, patient, { excludeExtraneousValues: true });
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    const patient = await this.patients.update(user.hospital_id, id, dto, user.sub);
    return plainToInstance(PatientResponseDto, patient, { excludeExtraneousValues: true });
  }

  @Get(":id/timeline")
  async getTimeline(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return {
      data: await this.timeline.getTimeline(user.hospital_id, id),
    };
  }
}
