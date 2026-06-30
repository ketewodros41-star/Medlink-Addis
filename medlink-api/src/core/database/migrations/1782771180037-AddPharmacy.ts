import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPharmacy1782771180037 implements MigrationInterface {
    name = 'AddPharmacy1782771180037'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."prescriptions_status_enum" AS ENUM('Pending', 'Ready', 'Hold', 'Dispensed')`);
        await queryRunner.query(`CREATE TABLE "prescriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "rxNumber" character varying(50) NOT NULL, "patient_id" uuid NOT NULL, "drugName" character varying(255) NOT NULL, "sig" character varying(255) NOT NULL, "qty" integer NOT NULL DEFAULT '1', "prescriberName" character varying(100) NOT NULL, "status" "public"."prescriptions_status_enum" NOT NULL DEFAULT 'Pending', "interactionAlert" boolean NOT NULL DEFAULT false, "interactionDetails" text, CONSTRAINT "UQ_192157a2aedc5d4aaed8fddf617" UNIQUE ("rxNumber"), CONSTRAINT "PK_097b2cc2f2b7e56825468188503" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_items_status_enum" AS ENUM('OK', 'Low', 'Critical')`);
        await queryRunner.query(`CREATE TABLE "inventory_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "drugName" character varying(255) NOT NULL, "stock" integer NOT NULL DEFAULT '0', "reorderLevel" integer NOT NULL DEFAULT '0', "expiryDate" TIMESTAMP NOT NULL, "status" "public"."inventory_items_status_enum" NOT NULL DEFAULT 'OK', CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "allergies" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "medical_flags" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_9389db557647131856661f7d7b5" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_9389db557647131856661f7d7b5"`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "medical_flags" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "allergies" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP TABLE "inventory_items"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_items_status_enum"`);
        await queryRunner.query(`DROP TABLE "prescriptions"`);
        await queryRunner.query(`DROP TYPE "public"."prescriptions_status_enum"`);
    }

}
