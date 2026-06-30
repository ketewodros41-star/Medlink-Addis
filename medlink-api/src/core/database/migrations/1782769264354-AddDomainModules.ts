import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDomainModules1782769264354 implements MigrationInterface {
    name = 'AddDomainModules1782769264354'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(100) NOT NULL, "resource" character varying(255) NOT NULL, "resourceId" uuid, "actorId" uuid, "details" jsonb, "ipAddress" character varying(45), "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "name" character varying(120) NOT NULL, "resource" character varying(120) NOT NULL, "action" character varying(80) NOT NULL, "description" text, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_48ce552495d14eae9b187bb671" ON "permissions" ("name") `);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "name" character varying(80) NOT NULL, "description" text, "is_system_role" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_37788db2f3d046f039e4428cc1" ON "roles" ("hospital_id", "name") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "email" character varying(120) NOT NULL, "phone_number" character varying(40), "first_name" character varying(80) NOT NULL, "last_name" character varying(80) NOT NULL, "password_hash" character varying(255) NOT NULL, "mfa_enabled" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6f4fcde7d58685ab9804fb9785" ON "users" ("hospital_id", "email") `);
        await queryRunner.query(`CREATE TYPE "public"."patients_gender_enum" AS ENUM('female', 'male', 'other', 'unknown')`);
        await queryRunner.query(`CREATE TABLE "patients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "mrn" character varying(40) NOT NULL, "national_id" character varying(80), "passport_number" character varying(80), "first_name" character varying(80) NOT NULL, "last_name" character varying(80) NOT NULL, "date_of_birth" date NOT NULL, "gender" "public"."patients_gender_enum" NOT NULL DEFAULT 'unknown', "blood_type" character varying(8), "primary_phone" character varying(40), "primary_email" character varying(120), "allergies" jsonb NOT NULL DEFAULT '[]'::jsonb, "medical_flags" jsonb NOT NULL DEFAULT '[]'::jsonb, "search_vector" tsvector, CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_56967d371aaaabae6f5c7f37d8" ON "patients" ("hospital_id", "national_id") WHERE national_id IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_50d2fc425dacf4949bfbd72a42" ON "patients" ("hospital_id", "mrn") `);
        await queryRunner.query(`CREATE TABLE "hospitals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "name" character varying(160) NOT NULL, "code" character varying(80) NOT NULL, "default_currency" character(3) NOT NULL DEFAULT 'ETB', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_02738c80d71453bc3e369a01766" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f85634ada164c5f4a2e52d2c87" ON "hospitals" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_21e0a14f85fd90af5c34cdc7d6" ON "hospitals" ("code") `);
        await queryRunner.query(`CREATE TABLE "soap_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subjective" text, "objective" text, "assessment" text, "plan" text, "diagnoses" jsonb, "signedBy" uuid, "signedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f062997a69a70c7cc0c889abd16" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "encounters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patientId" uuid NOT NULL, "doctorId" uuid NOT NULL, "appointmentId" uuid, "chiefComplaint" text, "status" character varying(50) NOT NULL DEFAULT 'In Progress', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "vitalSignsId" uuid, "soapNoteId" uuid, CONSTRAINT "REL_d36217bbe83a5b74c0ba71b723" UNIQUE ("vitalSignsId"), CONSTRAINT "REL_794d1c82e315350b95d7fe8241" UNIQUE ("soapNoteId"), CONSTRAINT "PK_b2e596be58aabc4ccc8f8458b53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vital_signs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bpSystolic" integer, "bpDiastolic" integer, "heartRate" integer, "temperature" numeric(4,1), "spo2" integer, "respiratoryRate" integer, "recordedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_83ba5a3455279f645885c327bb6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "user_id" uuid NOT NULL, "device_id" character varying(120) NOT NULL, "device_fingerprint" character varying(255), "ip_address" inet, "user_agent" text, "revoked_at" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7eb806936967a33460634ce173" ON "user_sessions" ("hospital_id", "user_id") `);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patientId" uuid NOT NULL, "doctorId" uuid NOT NULL, "scheduledTime" TIMESTAMP NOT NULL, "durationMinutes" integer NOT NULL DEFAULT '30', "status" character varying(50) NOT NULL DEFAULT 'Scheduled', "type" character varying(50) NOT NULL DEFAULT 'In-Person', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);
        await queryRunner.query(`ALTER TABLE "encounters" ADD CONSTRAINT "FK_d36217bbe83a5b74c0ba71b7238" FOREIGN KEY ("vitalSignsId") REFERENCES "vital_signs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "encounters" ADD CONSTRAINT "FK_794d1c82e315350b95d7fe82419" FOREIGN KEY ("soapNoteId") REFERENCES "soap_notes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "encounters" DROP CONSTRAINT "FK_794d1c82e315350b95d7fe82419"`);
        await queryRunner.query(`ALTER TABLE "encounters" DROP CONSTRAINT "FK_d36217bbe83a5b74c0ba71b7238"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7eb806936967a33460634ce173"`);
        await queryRunner.query(`DROP TABLE "user_sessions"`);
        await queryRunner.query(`DROP TABLE "vital_signs"`);
        await queryRunner.query(`DROP TABLE "encounters"`);
        await queryRunner.query(`DROP TABLE "soap_notes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21e0a14f85fd90af5c34cdc7d6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f85634ada164c5f4a2e52d2c87"`);
        await queryRunner.query(`DROP TABLE "hospitals"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_50d2fc425dacf4949bfbd72a42"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_56967d371aaaabae6f5c7f37d8"`);
        await queryRunner.query(`DROP TABLE "patients"`);
        await queryRunner.query(`DROP TYPE "public"."patients_gender_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6f4fcde7d58685ab9804fb9785"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_37788db2f3d046f039e4428cc1"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_48ce552495d14eae9b187bb671"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }

}
