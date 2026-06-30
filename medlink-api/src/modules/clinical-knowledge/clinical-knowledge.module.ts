import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClinicalKnowledgeController } from "./clinical-knowledge.controller";
import { ClinicalKnowledgeService } from "./clinical-knowledge.service";
import { ClinicalContentImporter } from "./importers/clinical-content.importer";
import { SourceFileImporter } from "./importers/source-file.importer";
import { ClinicalContentVersion } from "./entities/clinical-content-version.entity";
import { KnowledgeDisease } from "./entities/knowledge-disease.entity";
import { KnowledgeGuideline } from "./entities/knowledge-guideline.entity";
import { KnowledgeImagingStudy } from "./entities/knowledge-imaging-study.entity";
import { KnowledgeLabTest } from "./entities/knowledge-lab-test.entity";
import { KnowledgeMedication } from "./entities/knowledge-medication.entity";
import { KnowledgeProcedure } from "./entities/knowledge-procedure.entity";
import { KnowledgeSymptom } from "./entities/knowledge-symptom.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicalContentVersion,
      KnowledgeDisease,
      KnowledgeSymptom,
      KnowledgeMedication,
      KnowledgeLabTest,
      KnowledgeImagingStudy,
      KnowledgeProcedure,
      KnowledgeGuideline,
    ]),
  ],
  controllers: [ClinicalKnowledgeController],
  providers: [ClinicalKnowledgeService, ClinicalContentImporter, SourceFileImporter],
  exports: [ClinicalKnowledgeService],
})
export class ClinicalKnowledgeModule {}
