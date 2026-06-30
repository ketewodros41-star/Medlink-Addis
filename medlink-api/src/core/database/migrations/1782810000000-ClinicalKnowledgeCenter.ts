import { MigrationInterface, QueryRunner } from "typeorm";

export class ClinicalKnowledgeCenter1782810000000 implements MigrationInterface {
  name = "ClinicalKnowledgeCenter1782810000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await queryRunner.query(`
      CREATE TABLE "clinical_content_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "dataset" varchar(80) NOT NULL,
        "source_name" varchar(180) NOT NULL,
        "source_url" text,
        "published_at" date,
        "imported_at" timestamptz NOT NULL DEFAULT now(),
        "status" varchar(30) NOT NULL DEFAULT 'draft',
        "version_label" varchar(80) NOT NULL,
        CONSTRAINT "PK_clinical_content_versions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_clinical_content_versions_dataset_version" UNIQUE ("dataset", "version_label")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "knowledge_diseases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "icd10_code" varchar(40) NOT NULL,
        "name" varchar(220) NOT NULL,
        "alternative_names" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "body_system" varchar(120) NOT NULL,
        "description" text,
        "epidemiology" text,
        "causes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "risk_factors" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "clinical_presentation" text,
        "symptoms" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "physical_signs" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "differential_diagnoses" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "recommended_investigations" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "laboratory_findings" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "imaging_findings" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "first_line_treatment" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "alternative_treatment" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "complications" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "emergency_red_flags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "follow_up_recommendations" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "patient_education" text,
        "references" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "evidence_level" varchar(40) NOT NULL DEFAULT 'moderate',
        "last_reviewed" date,
        "dataset_version" varchar(80) NOT NULL DEFAULT 'starter-2026.06',
        CONSTRAINT "PK_knowledge_diseases" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knowledge_diseases_icd10_code" UNIQUE ("icd10_code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "knowledge_symptoms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "name" varchar(180) NOT NULL,
        "synonyms" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "body_system" varchar(120) NOT NULL,
        "description" text,
        "common_causes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "emergency_causes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "associated_diseases" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "related_symptoms" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "dataset_version" varchar(80) NOT NULL DEFAULT 'starter-2026.06',
        CONSTRAINT "PK_knowledge_symptoms" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knowledge_symptoms_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "knowledge_medications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "generic_name" varchar(180) NOT NULL,
        "brand_names" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "drug_class" varchar(160) NOT NULL,
        "therapeutic_category" varchar(160) NOT NULL,
        "dosage_forms" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "adult_dosing" text,
        "pediatric_dosing" text,
        "pregnancy_category" varchar(80),
        "lactation_information" text,
        "contraindications" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "precautions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "side_effects" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "drug_interactions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "monitoring_requirements" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "renal_dose_adjustment" text,
        "hepatic_dose_adjustment" text,
        "storage_conditions" text,
        "references" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "dataset_version" varchar(80) NOT NULL DEFAULT 'starter-2026.06',
        CONSTRAINT "PK_knowledge_medications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knowledge_medications_generic_name" UNIQUE ("generic_name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "knowledge_lab_tests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "test_name" varchar(180) NOT NULL,
        "alternative_names" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "description" text,
        "specimen_type" varchar(120),
        "preparation" text,
        "normal_reference_range" text,
        "units" varchar(40),
        "clinical_interpretation" text,
        "related_diseases" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "dataset_version" varchar(80) NOT NULL DEFAULT 'starter-2026.06',
        CONSTRAINT "PK_knowledge_lab_tests" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knowledge_lab_tests_test_name" UNIQUE ("test_name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "knowledge_imaging_studies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "study_name" varchar(180) NOT NULL,
        "modality" varchar(80) NOT NULL,
        "clinical_indications" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "contraindications" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "typical_findings" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "preparation" text,
        "related_diseases" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "dataset_version" varchar(80) NOT NULL DEFAULT 'starter-2026.06',
        CONSTRAINT "PK_knowledge_imaging_studies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knowledge_imaging_studies_study_name" UNIQUE ("study_name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "knowledge_procedures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "procedure_name" varchar(180) NOT NULL,
        "indications" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "contraindications" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "required_equipment" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "complications" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "aftercare" text,
        "dataset_version" varchar(80) NOT NULL DEFAULT 'starter-2026.06',
        CONSTRAINT "PK_knowledge_procedures" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knowledge_procedures_procedure_name" UNIQUE ("procedure_name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "knowledge_guidelines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        "version" integer NOT NULL DEFAULT 1,
        "guideline_name" varchar(220) NOT NULL,
        "specialty" varchar(120) NOT NULL,
        "clinical_scenario" text NOT NULL,
        "workflow_steps" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "references" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "content_version" varchar(80) NOT NULL,
        CONSTRAINT "PK_knowledge_guidelines" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knowledge_guidelines_name_version" UNIQUE ("guideline_name", "content_version")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_knowledge_diseases_search" ON "knowledge_diseases" USING GIN (to_tsvector('english', coalesce("name",'') || ' ' || coalesce("icd10_code",'') || ' ' || coalesce("description",'') || ' ' || coalesce("alternative_names"::text,'') || ' ' || coalesce("symptoms"::text,'')))`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_diseases_name_trgm" ON "knowledge_diseases" USING GIN ("name" gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_symptoms_search" ON "knowledge_symptoms" USING GIN (to_tsvector('english', coalesce("name",'') || ' ' || coalesce("description",'') || ' ' || coalesce("synonyms"::text,'')))`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_symptoms_name_trgm" ON "knowledge_symptoms" USING GIN ("name" gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_medications_search" ON "knowledge_medications" USING GIN (to_tsvector('english', coalesce("generic_name",'') || ' ' || coalesce("drug_class",'') || ' ' || coalesce("brand_names"::text,'') || ' ' || coalesce("drug_interactions"::text,'')))`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_medications_name_trgm" ON "knowledge_medications" USING GIN ("generic_name" gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_lab_tests_search" ON "knowledge_lab_tests" USING GIN (to_tsvector('english', coalesce("test_name",'') || ' ' || coalesce("description",'') || ' ' || coalesce("alternative_names"::text,'')))`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_lab_tests_name_trgm" ON "knowledge_lab_tests" USING GIN ("test_name" gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_imaging_search" ON "knowledge_imaging_studies" USING GIN (to_tsvector('english', coalesce("study_name",'') || ' ' || coalesce("modality",'') || ' ' || coalesce("clinical_indications"::text,'')))`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_procedures_search" ON "knowledge_procedures" USING GIN (to_tsvector('english', coalesce("procedure_name",'') || ' ' || coalesce("indications"::text,'')))`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_guidelines_search" ON "knowledge_guidelines" USING GIN (to_tsvector('english', coalesce("guideline_name",'') || ' ' || coalesce("specialty",'') || ' ' || coalesce("clinical_scenario",'') || ' ' || coalesce("workflow_steps"::text,'')))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_guidelines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_procedures"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_imaging_studies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_lab_tests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_medications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_symptoms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_diseases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinical_content_versions"`);
  }
}
