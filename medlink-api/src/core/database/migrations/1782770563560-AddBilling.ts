import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBilling1782770563560 implements MigrationInterface {
    name = 'AddBilling1782770563560'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "invoice_id" uuid NOT NULL, "description" character varying(255) NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unitPrice" numeric(12,2) NOT NULL, "taxRate" numeric(5,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL, "serviceType" character varying(50), CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."invoices_status_enum" AS ENUM('Draft', 'Unpaid', 'Partial', 'Paid', 'Insurance', 'Void')`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "patient_id" uuid NOT NULL, "invoiceNumber" character varying(50) NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'Unpaid', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "taxTotal" numeric(12,2) NOT NULL DEFAULT '0', "discountTotal" numeric(12,2) NOT NULL DEFAULT '0', "grandTotal" numeric(12,2) NOT NULL DEFAULT '0', "amountPaid" numeric(12,2) NOT NULL DEFAULT '0', "dueDate" TIMESTAMP, CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_method_enum" AS ENUM('Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Insurance')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" uuid, "updated_by" uuid, "version" integer NOT NULL, "hospital_id" uuid NOT NULL, "invoice_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "method" "public"."payments_method_enum" NOT NULL, "referenceNumber" character varying(100), "paymentDate" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "allergies" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "medical_flags" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_dc991d555664682cfe892eea2c1" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_e3be0c11f4ce66b9b352477cb06" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_563a5e248518c623eebd987d43e" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_563a5e248518c623eebd987d43e"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_e3be0c11f4ce66b9b352477cb06"`);
        await queryRunner.query(`ALTER TABLE "invoice_items" DROP CONSTRAINT "FK_dc991d555664682cfe892eea2c1"`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "medical_flags" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "allergies" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
        await queryRunner.query(`DROP TABLE "invoice_items"`);
    }

}
