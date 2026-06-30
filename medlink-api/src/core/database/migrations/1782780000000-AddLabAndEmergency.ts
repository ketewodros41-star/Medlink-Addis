import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLabAndEmergency1782780000000 implements MigrationInterface {
    name = 'AddLabAndEmergency1782780000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Lab Orders
        await queryRunner.query(`CREATE TYPE "public"."lab_orders_status_enum" AS ENUM('Pending', 'Collected', 'Processing', 'Resulted', 'Critical')`);
        await queryRunner.query(`CREATE TABLE "lab_orders" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "deleted_at" TIMESTAMP WITH TIME ZONE, 
            "created_by" uuid, 
            "updated_by" uuid, 
            "version" integer NOT NULL DEFAULT 1, 
            "hospital_id" uuid NOT NULL, 
            "patient_id" uuid NOT NULL, 
            "doctor_id" uuid NOT NULL, 
            "encounter_id" uuid, 
            "test_name" character varying(255) NOT NULL, 
            "status" "public"."lab_orders_status_enum" NOT NULL DEFAULT 'Pending', 
            "result" text, 
            "critical_notes" text, 
            CONSTRAINT "PK_lab_orders" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "lab_orders" ADD CONSTRAINT "FK_lab_orders_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Emergency Triage Entries
        await queryRunner.query(`CREATE TYPE "public"."triage_entries_status_enum" AS ENUM('Waiting', 'Assessment', 'Treatment', 'Resuscitation', 'Discharged', 'Admitted')`);
        await queryRunner.query(`CREATE TABLE "triage_entries" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "deleted_at" TIMESTAMP WITH TIME ZONE, 
            "created_by" uuid, 
            "updated_by" uuid, 
            "version" integer NOT NULL DEFAULT 1, 
            "hospital_id" uuid NOT NULL, 
            "patient_id" uuid, 
            "patient_name" character varying(255) NOT NULL, 
            "age" integer NOT NULL, 
            "gender" character varying(50) NOT NULL, 
            "complaint" text NOT NULL, 
            "priority" integer NOT NULL, 
            "priority_label" character varying(50) NOT NULL, 
            "status" "public"."triage_entries_status_enum" NOT NULL DEFAULT 'Waiting', 
            "color" character varying(10) NOT NULL, 
            "arrived_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_triage_entries" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "triage_entries" ADD CONSTRAINT "FK_triage_entries_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "triage_entries" DROP CONSTRAINT "FK_triage_entries_patient"`);
        await queryRunner.query(`DROP TABLE "triage_entries"`);
        await queryRunner.query(`DROP TYPE "public"."triage_entries_status_enum"`);
        await queryRunner.query(`ALTER TABLE "lab_orders" DROP CONSTRAINT "FK_lab_orders_patient"`);
        await queryRunner.query(`DROP TABLE "lab_orders"`);
        await queryRunner.query(`DROP TYPE "public"."lab_orders_status_enum"`);
    }
}
