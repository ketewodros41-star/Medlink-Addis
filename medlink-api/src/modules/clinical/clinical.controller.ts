import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ClinicalService } from "./clinical.service";
import { CreateEncounterDto } from "./dto/create-encounter.dto";
import { UpdateSoapNoteDto } from "./dto/update-soap-note.dto";
import { RecordVitalsDto } from "./dto/record-vitals.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/types/jwt-payload.type";

@Controller("clinical")
@UseGuards(JwtAuthGuard)
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  @Get("reference-search")
  searchKnowledgeBase(@Query("query") query: string) {
    return this.clinicalService.searchKnowledgeBase(query);
  }

  @Get("symptom-search")
  symptomSearch(@CurrentUser() user: JwtPayload, @Query("query") query: string) {
    return this.clinicalService.symptomSearch(user.hospital_id, query);
  }


  @Post("encounters")
  createEncounter(@Body() dto: CreateEncounterDto, @CurrentUser() user: JwtPayload) {
    return this.clinicalService.createEncounter(dto, user.hospital_id, user.sub);
  }

  @Get("encounters/patient/:patientId")
  listByPatient(@Param("patientId") patientId: string, @CurrentUser() user: JwtPayload) {
    return this.clinicalService.listByPatient(patientId, user.hospital_id);
  }

  @Get("encounters/:id")
  getEncounter(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.clinicalService.getEncounter(id, user.hospital_id, user.sub);
  }

  @Patch("encounters/:id/soap-note")
  updateSoapNote(@Param("id") id: string, @Body() dto: UpdateSoapNoteDto, @CurrentUser() user: JwtPayload) {
    return this.clinicalService.updateSoapNote(id, user.hospital_id, dto, user.sub);
  }

  @Post("encounters/:id/vitals")
  recordVitals(@Param("id") id: string, @Body() dto: RecordVitalsDto, @CurrentUser() user: JwtPayload) {
    return this.clinicalService.recordVitals(id, user.hospital_id, dto, user.sub);
  }

  @Patch("encounters/:id/sign")
  signEncounter(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.clinicalService.signEncounter(id, user.hospital_id, user.sub);
  }
}
