import { MigrationInterface, QueryRunner } from "typeorm";

export class HospitalWorkflowSchema1782790000000 implements MigrationInterface {
    name = 'HospitalWorkflowSchema1782790000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Patient Timelines Table
        await queryRunner.query(`CREATE TABLE "patient_timelines" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "created_by" uuid,
            "updated_by" uuid,
            "version" integer NOT NULL DEFAULT 1,
            "hospital_id" uuid NOT NULL,
            "patient_id" uuid NOT NULL,
            "event_type" character varying(100) NOT NULL,
            "title" character varying(255) NOT NULL,
            "description" text,
            "metadata" jsonb,
            CONSTRAINT "PK_patient_timelines" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "patient_timelines" ADD CONSTRAINT "FK_patient_timelines_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_patient_timelines_patient" ON "patient_timelines" ("patient_id")`);
        await queryRunner.query(`CREATE INDEX "idx_patient_timelines_hospital" ON "patient_timelines" ("hospital_id")`);

        // Queue Entries Table
        await queryRunner.query(`CREATE TABLE "queue_entries" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "created_by" uuid,
            "updated_by" uuid,
            "version" integer NOT NULL DEFAULT 1,
            "hospital_id" uuid NOT NULL,
            "patient_id" uuid NOT NULL,
            "queue_number" character varying(20) NOT NULL,
            "current_dept" character varying(100) NOT NULL,
            "status" character varying(50) NOT NULL DEFAULT 'Waiting',
            "estimated_wait_mins" integer NOT NULL DEFAULT 15,
            "called_at" TIMESTAMP WITH TIME ZONE,
            CONSTRAINT "PK_queue_entries" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "queue_entries" ADD CONSTRAINT "FK_queue_entries_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_queue_entries_hospital" ON "queue_entries" ("hospital_id")`);

        // Wards Table
        await queryRunner.query(`CREATE TABLE "wards" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "created_by" uuid,
            "updated_by" uuid,
            "version" integer NOT NULL DEFAULT 1,
            "hospital_id" uuid NOT NULL,
            "name" character varying(100) NOT NULL,
            "code" character varying(50) NOT NULL,
            "color" character varying(20) NOT NULL,
            CONSTRAINT "PK_wards" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "idx_wards_hospital" ON "wards" ("hospital_id")`);

        // Beds Table
        await queryRunner.query(`CREATE TABLE "beds" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "created_by" uuid,
            "updated_by" uuid,
            "version" integer NOT NULL DEFAULT 1,
            "hospital_id" uuid NOT NULL,
            "ward_id" uuid NOT NULL,
            "room_number" character varying(50) NOT NULL,
            "bed_number" character varying(50) NOT NULL,
            "status" character varying(50) NOT NULL DEFAULT 'Clean',
            CONSTRAINT "PK_beds" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "beds" ADD CONSTRAINT "FK_beds_ward" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_beds_hospital" ON "beds" ("hospital_id")`);

        // Bed Admissions Table (linking patient to bed)
        await queryRunner.query(`CREATE TABLE "bed_admissions" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "created_by" uuid,
            "updated_by" uuid,
            "version" integer NOT NULL DEFAULT 1,
            "hospital_id" uuid NOT NULL,
            "patient_id" uuid NOT NULL,
            "bed_id" uuid NOT NULL,
            "admitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "discharged_at" TIMESTAMP WITH TIME ZONE,
            "status" character varying(50) NOT NULL DEFAULT 'Admitted',
            CONSTRAINT "PK_bed_admissions" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "bed_admissions" ADD CONSTRAINT "FK_bed_admissions_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bed_admissions" ADD CONSTRAINT "FK_bed_admissions_bed" FOREIGN KEY ("bed_id") REFERENCES "beds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_bed_admissions_hospital" ON "bed_admissions" ("hospital_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bed_admissions" DROP CONSTRAINT "FK_bed_admissions_bed"`);
        await queryRunner.query(`ALTER TABLE "bed_admissions" DROP CONSTRAINT "FK_bed_admissions_patient"`);
        await queryRunner.query(`DROP TABLE "bed_admissions"`);
        await queryRunner.query(`ALTER TABLE "beds" DROP CONSTRAINT "FK_beds_ward"`);
        await queryRunner.query(`DROP TABLE "beds"`);
        await queryRunner.query(`DROP TABLE "wards"`);
        await queryRunner.query(`ALTER TABLE "queue_entries" DROP CONSTRAINT "FK_queue_entries_patient"`);
        await queryRunner.query(`DROP TABLE "queue_entries"`);
        await queryRunner.query(`ALTER TABLE "patient_timelines" DROP CONSTRAINT "FK_patient_timelines_patient"`);
        await queryRunner.query(`DROP TABLE "patient_timelines"`);
    }
}
