import { Body, Controller, ForbiddenException, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../auth/types/jwt-payload.type";
import { ClinicalKnowledgeService } from "./clinical-knowledge.service";
import { ClinicalContentImporter } from "./importers/clinical-content.importer";
import { CalculateScoreDto } from "./dto/calculate-score.dto";
import { ClinicalKnowledgeQueryDto } from "./dto/clinical-knowledge-query.dto";
import { ImportClinicalContentDto } from "./dto/import-clinical-content.dto";
import { ImportSourceFileDto } from "./dto/import-source-file.dto";
import { SourceFileImporter } from "./importers/source-file.importer";

@Controller("clinical-knowledge")
@UseGuards(JwtAuthGuard)
export class ClinicalKnowledgeController {
  constructor(
    private readonly knowledge: ClinicalKnowledgeService,
    private readonly importer: ClinicalContentImporter,
    private readonly sourceFileImporter: SourceFileImporter,
  ) {}

  @Get("specialties")
  specialties() {
    return this.knowledge.getSpecialties();
  }

  @Get("search")
  search(@Query() query: ClinicalKnowledgeQueryDto) {
    return this.knowledge.search(query);
  }

  @Get("assist")
  assist(@CurrentUser() user: JwtPayload, @Query("query") query: string) {
    return this.knowledge.assist(user.hospital_id, query);
  }

  @Get("detail/:domain/:id")
  detail(@Param("domain") domain: string, @Param("id") id: string) {
    return this.knowledge.detailByDomain(domain, id);
  }

  @Get("calculators")
  calculators() {
    return this.knowledge.getCalculators();
  }

  @Post("calculators/:id/calculate")
  calculate(@Param("id") id: string, @Body() dto: CalculateScoreDto) {
    return this.knowledge.calculate(id, dto);
  }

  @Post("differential")
  differential(@Body("symptoms") symptoms: string[]) {
    return this.knowledge.findDifferential(symptoms);
  }

  @Post("imports")
  import(@CurrentUser() user: JwtPayload, @Body() dto: ImportClinicalContentDto) {
    const isAdmin = user.roles.some((role) => role.toLowerCase().includes("admin"));
    if (!isAdmin) throw new ForbiddenException("Only administrators can import clinical reference datasets");
    return this.importer.import(dto, user.sub);
  }

  @Post("imports/source-file")
  importSourceFile(@CurrentUser() user: JwtPayload, @Body() dto: ImportSourceFileDto) {
    const isAdmin = user.roles.some((role) => role.toLowerCase().includes("admin"));
    if (!isAdmin) throw new ForbiddenException("Only administrators can import clinical reference datasets");
    return this.sourceFileImporter.import(dto, user.sub);
  }
}
