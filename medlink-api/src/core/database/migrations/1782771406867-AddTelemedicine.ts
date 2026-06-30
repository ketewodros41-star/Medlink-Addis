import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTelemedicine1782771406867 implements MigrationInterface {
    name = 'AddTelemedicine1782771406867'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."telemedicine_sessions_status_enum" AS ENUM('Scheduled', 'Active', 'Completed', 'Ended')`);
        await queryRunner.query(`CREATE TABLE "telemedicine_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "patient_id" uuid NOT NULL, "doctorId" uuid NOT NULL, "status" "public"."telemedicine_sessions_status_enum" NOT NULL DEFAULT 'Scheduled', "roomUrl" character varying(255), "startedAt" TIMESTAMP, "endedAt" TIMESTAMP, CONSTRAINT "PK_6d75e15b799edce1fe22987721d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."telemedicine_chat_messages_sendertype_enum" AS ENUM('doctor', 'patient')`);
        await queryRunner.query(`CREATE TABLE "telemedicine_chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "session_id" uuid NOT NULL, "senderType" "public"."telemedicine_chat_messages_sendertype_enum" NOT NULL, "text" text NOT NULL, CONSTRAINT "PK_f130bc5431cbcf473ca17d80363" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "allergies" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "medical_flags" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "telemedicine_sessions" ADD CONSTRAINT "FK_01ae27637d0e8b6ff3046b84501" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "telemedicine_chat_messages" ADD CONSTRAINT "FK_63f3600d097a1db0c738bd258ed" FOREIGN KEY ("session_id") REFERENCES "telemedicine_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "telemedicine_chat_messages" DROP CONSTRAINT "FK_63f3600d097a1db0c738bd258ed"`);
        await queryRunner.query(`ALTER TABLE "telemedicine_sessions" DROP CONSTRAINT "FK_01ae27637d0e8b6ff3046b84501"`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "medical_flags" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "allergies" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP TABLE "telemedicine_chat_messages"`);
        await queryRunner.query(`DROP TYPE "public"."telemedicine_chat_messages_sendertype_enum"`);
        await queryRunner.query(`DROP TABLE "telemedicine_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."telemedicine_sessions_status_enum"`);
    }

}
