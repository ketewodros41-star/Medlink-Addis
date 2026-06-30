import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClinicalContentVersion } from "../entities/clinical-content-version.entity";
import { KnowledgeDisease } from "../entities/knowledge-disease.entity";
import { KnowledgeGuideline } from "../entities/knowledge-guideline.entity";
import { KnowledgeImagingStudy } from "../entities/knowledge-imaging-study.entity";
import { KnowledgeLabTest } from "../entities/knowledge-lab-test.entity";
import { KnowledgeMedication } from "../entities/knowledge-medication.entity";
import { KnowledgeProcedure } from "../entities/knowledge-procedure.entity";
import { KnowledgeSymptom } from "../entities/knowledge-symptom.entity";
import { ImportClinicalContentDto } from "../dto/import-clinical-content.dto";

type ImportSummary = {
  dataset: string;
  version: string;
  inserted: number;
  updated: number;
  skipped: number;
};

const arrayValue = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(/[;,|]/).map((part) => part.trim()).filter(Boolean);
  }
  return [];
};

const text = (record: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return null;
};

@Injectable()
export class ClinicalContentImporter {
  constructor(
    @InjectRepository(ClinicalContentVersion)
    private readonly versions: Repository<ClinicalContentVersion>,
    @InjectRepository(KnowledgeDisease)
    private readonly diseases: Repository<KnowledgeDisease>,
    @InjectRepository(KnowledgeSymptom)
    private readonly symptoms: Repository<KnowledgeSymptom>,
    @InjectRepository(KnowledgeMedication)
    private readonly medications: Repository<KnowledgeMedication>,
    @InjectRepository(KnowledgeLabTest)
    private readonly labs: Repository<KnowledgeLabTest>,
    @InjectRepository(KnowledgeImagingStudy)
    private readonly imaging: Repository<KnowledgeImagingStudy>,
    @InjectRepository(KnowledgeProcedure)
    private readonly procedures: Repository<KnowledgeProcedure>,
    @InjectRepository(KnowledgeGuideline)
    private readonly guidelines: Repository<KnowledgeGuideline>,
  ) {}

  async import(dto: ImportClinicalContentDto, actorId: string): Promise<ImportSummary> {
    if (!dto.records.length) throw new BadRequestException("Import payload contains no records");

    await this.versions.upsert(
      {
        dataset: dto.dataset,
        versionLabel: dto.version,
        sourceName: dto.source.name,
        sourceUrl: dto.source.url ?? null,
        publishedAt: dto.source.publishedAt ?? null,
        status: "draft",
        createdBy: actorId,
        updatedBy: actorId,
      },
      ["dataset", "versionLabel"],
    );

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const record of dto.records) {
      const result = await this.importRecord(dto.dataset, dto.version, record, actorId);
      if (result === "inserted") inserted += 1;
      if (result === "updated") updated += 1;
      if (result === "skipped") skipped += 1;
    }

    return { dataset: dto.dataset, version: dto.version, inserted, updated, skipped };
  }

  private async importRecord(dataset: string, version: string, record: Record<string, unknown>, actorId: string) {
    switch (dataset) {
      case "diseases":
        return this.upsertDisease(record, version, actorId);
      case "symptoms":
        return this.upsertSymptom(record, version, actorId);
      case "medications":
        return this.upsertMedication(record, version, actorId);
      case "labs":
        return this.upsertLab(record, version, actorId);
      case "imaging":
        return this.upsertImaging(record, version, actorId);
      case "procedures":
        return this.upsertProcedure(record, version, actorId);
      case "guidelines":
        return this.upsertGuideline(record, version, actorId);
      default:
        throw new BadRequestException(`Unsupported dataset: ${dataset}`);
    }
  }

  private async upsertDisease(record: Record<string, unknown>, version: string, actorId: string) {
    const icd10Code = text(record, "icd10Code", "icd10_code", "code");
    const name = text(record, "name", "diseaseName", "disease_name");
    if (!icd10Code || !name) return "skipped";
    const existing = await this.diseases.findOne({ where: { icd10Code } });
    await this.diseases.save({
      ...(existing ?? {}),
      icd10Code,
      name,
      alternativeNames: arrayValue(record.alternativeNames ?? record.alternative_names),
      bodySystem: text(record, "bodySystem", "body_system", "specialty") ?? "General Medicine",
      description: text(record, "description"),
      epidemiology: text(record, "epidemiology"),
      causes: arrayValue(record.causes),
      riskFactors: arrayValue(record.riskFactors ?? record.risk_factors),
      clinicalPresentation: text(record, "clinicalPresentation", "clinical_presentation"),
      symptoms: arrayValue(record.symptoms),
      physicalSigns: arrayValue(record.physicalSigns ?? record.physical_signs ?? record.signs),
      differentialDiagnoses: arrayValue(record.differentialDiagnoses ?? record.differentials),
      recommendedInvestigations: arrayValue(record.recommendedInvestigations ?? record.investigations),
      laboratoryFindings: arrayValue(record.laboratoryFindings),
      imagingFindings: arrayValue(record.imagingFindings),
      firstLineTreatment: arrayValue(record.firstLineTreatment ?? record.treatments),
      alternativeTreatment: arrayValue(record.alternativeTreatment),
      complications: arrayValue(record.complications),
      emergencyRedFlags: arrayValue(record.emergencyRedFlags ?? record.redFlags),
      followUpRecommendations: arrayValue(record.followUpRecommendations),
      patientEducation: text(record, "patientEducation"),
      references: Array.isArray(record.references) ? (record.references as any[]) : [],
      evidenceLevel: text(record, "evidenceLevel") ?? "moderate",
      lastReviewed: text(record, "lastReviewed"),
      datasetVersion: version,
      createdBy: existing?.createdBy ?? actorId,
      updatedBy: actorId,
    });
    return existing ? "updated" : "inserted";
  }

  private async upsertSymptom(record: Record<string, unknown>, version: string, actorId: string) {
    const name = text(record, "name", "symptomName");
    if (!name) return "skipped";
    const existing = await this.symptoms.findOne({ where: { name } });
    await this.symptoms.save({
      ...(existing ?? {}),
      name,
      synonyms: arrayValue(record.synonyms),
      bodySystem: text(record, "bodySystem") ?? "General Medicine",
      description: text(record, "description"),
      commonCauses: arrayValue(record.commonCauses),
      emergencyCauses: arrayValue(record.emergencyCauses),
      associatedDiseases: arrayValue(record.associatedDiseases),
      relatedSymptoms: arrayValue(record.relatedSymptoms),
      datasetVersion: version,
      createdBy: existing?.createdBy ?? actorId,
      updatedBy: actorId,
    });
    return existing ? "updated" : "inserted";
  }

  private async upsertMedication(record: Record<string, unknown>, version: string, actorId: string) {
    const genericName = text(record, "genericName", "generic_name", "name");
    if (!genericName) return "skipped";
    const existing = await this.medications.findOne({ where: { genericName } });
    await this.medications.save({
      ...(existing ?? {}),
      genericName,
      brandNames: arrayValue(record.brandNames),
      drugClass: text(record, "drugClass") ?? "Unclassified",
      therapeuticCategory: text(record, "therapeuticCategory") ?? "General",
      dosageForms: arrayValue(record.dosageForms),
      adultDosing: text(record, "adultDosing"),
      pediatricDosing: text(record, "pediatricDosing"),
      pregnancyCategory: text(record, "pregnancyCategory"),
      lactationInformation: text(record, "lactationInformation"),
      contraindications: arrayValue(record.contraindications),
      precautions: arrayValue(record.precautions),
      sideEffects: arrayValue(record.sideEffects),
      drugInteractions: arrayValue(record.drugInteractions),
      monitoringRequirements: arrayValue(record.monitoringRequirements),
      renalDoseAdjustment: text(record, "renalDoseAdjustment"),
      hepaticDoseAdjustment: text(record, "hepaticDoseAdjustment"),
      storageConditions: text(record, "storageConditions"),
      references: Array.isArray(record.references) ? (record.references as any[]) : [],
      datasetVersion: version,
      createdBy: existing?.createdBy ?? actorId,
      updatedBy: actorId,
    });
    return existing ? "updated" : "inserted";
  }

  private async upsertLab(record: Record<string, unknown>, version: string, actorId: string) {
    const testName = text(record, "testName", "name");
    if (!testName) return "skipped";
    const existing = await this.labs.findOne({ where: { testName } });
    await this.labs.save({
      ...(existing ?? {}),
      testName,
      alternativeNames: arrayValue(record.alternativeNames),
      description: text(record, "description"),
      specimenType: text(record, "specimenType"),
      preparation: text(record, "preparation"),
      normalReferenceRange: text(record, "normalReferenceRange"),
      units: text(record, "units"),
      clinicalInterpretation: text(record, "clinicalInterpretation"),
      relatedDiseases: arrayValue(record.relatedDiseases),
      datasetVersion: version,
      createdBy: existing?.createdBy ?? actorId,
      updatedBy: actorId,
    });
    return existing ? "updated" : "inserted";
  }

  private async upsertImaging(record: Record<string, unknown>, version: string, actorId: string) {
    const studyName = text(record, "studyName", "name");
    if (!studyName) return "skipped";
    const existing = await this.imaging.findOne({ where: { studyName } });
    await this.imaging.save({
      ...(existing ?? {}),
      studyName,
      modality: text(record, "modality") ?? "Imaging",
      clinicalIndications: arrayValue(record.clinicalIndications),
      contraindications: arrayValue(record.contraindications),
      typicalFindings: arrayValue(record.typicalFindings),
      preparation: text(record, "preparation"),
      relatedDiseases: arrayValue(record.relatedDiseases),
      datasetVersion: version,
      createdBy: existing?.createdBy ?? actorId,
      updatedBy: actorId,
    });
    return existing ? "updated" : "inserted";
  }

  private async upsertProcedure(record: Record<string, unknown>, version: string, actorId: string) {
    const procedureName = text(record, "procedureName", "name");
    if (!procedureName) return "skipped";
    const existing = await this.procedures.findOne({ where: { procedureName } });
    await this.procedures.save({
      ...(existing ?? {}),
      procedureName,
      indications: arrayValue(record.indications),
      contraindications: arrayValue(record.contraindications),
      requiredEquipment: arrayValue(record.requiredEquipment),
      complications: arrayValue(record.complications),
      aftercare: text(record, "aftercare"),
      datasetVersion: version,
      createdBy: existing?.createdBy ?? actorId,
      updatedBy: actorId,
    });
    return existing ? "updated" : "inserted";
  }

  private async upsertGuideline(record: Record<string, unknown>, version: string, actorId: string) {
    const guidelineName = text(record, "guidelineName", "name");
    if (!guidelineName) return "skipped";
    const existing = await this.guidelines.findOne({ where: { guidelineName, contentVersion: version } });
    await this.guidelines.save({
      ...(existing ?? {}),
      guidelineName,
      specialty: text(record, "specialty") ?? "General Medicine",
      clinicalScenario: text(record, "clinicalScenario") ?? "",
      workflowSteps: arrayValue(record.workflowSteps),
      references: Array.isArray(record.references) ? (record.references as any[]) : [],
      contentVersion: version,
      createdBy: existing?.createdBy ?? actorId,
      updatedBy: actorId,
    });
    return existing ? "updated" : "inserted";
  }
}
