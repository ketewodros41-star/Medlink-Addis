import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

/**
 * Hardening migration:
 * 1. appointments — add TenantBaseEntity columns (hospital_id etc), rename camelCase → snake_case, add indexes
 * 2. encounters   — same treatment
 * 3. soap_notes   — rename camelCase columns
 * 4. vital_signs  — rename camelCase columns (spo2 already lowercase, skip it)
 * 5. invoices     — replace global unique on invoice_number with per-hospital composite index
 * 6. prescriptions — replace global unique on rx_number with per-hospital composite index
 */
export class HardenAppointmentsAndClinical1782775000000 implements MigrationInterface {
  name = "HardenAppointmentsAndClinical1782775000000";

  public async up(queryRunner: QueryRunner): Promise<void> {

    // ═══════════════════════════════════════════════════════════════════════
    // 1. appointments table
    // ═══════════════════════════════════════════════════════════════════════
    await queryRunner.addColumn(
      "appointments",
      new TableColumn({ name: "hospital_id", type: "uuid", isNullable: true }),
    );
    await queryRunner.addColumn(
      "appointments",
      new TableColumn({ name: "created_by", type: "uuid", isNullable: true }),
    );
    await queryRunner.addColumn(
      "appointments",
      new TableColumn({ name: "updated_by", type: "uuid", isNullable: true }),
    );
    await queryRunner.addColumn(
      "appointments",
      new TableColumn({ name: "deleted_at", type: "timestamptz", isNullable: true }),
    );
    await queryRunner.addColumn(
      "appointments",
      new TableColumn({ name: "version", type: "integer", isNullable: false, default: 1 }),
    );

    // Backfill hospital_id from existing hospital row
    await queryRunner.query(`
      UPDATE appointments SET hospital_id = (SELECT id FROM hospitals LIMIT 1)
      WHERE hospital_id IS NULL
    `);

    await queryRunner.query(`ALTER TABLE appointments ALTER COLUMN hospital_id SET NOT NULL`);

    // Rename camelCase → snake_case for appointments
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN "patientId" TO patient_id`);
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN "doctorId" TO doctor_id`);
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN "durationMinutes" TO duration_minutes`);
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN "updatedAt" TO updated_at`);

    // Change scheduledTime to snake_case AND upgrade to timestamptz in one step
    await queryRunner.query(`
      ALTER TABLE appointments
        RENAME COLUMN "scheduledTime" TO scheduled_time
    `);
    await queryRunner.query(`
      ALTER TABLE appointments
        ALTER COLUMN scheduled_time TYPE TIMESTAMPTZ
        USING scheduled_time AT TIME ZONE 'UTC'
    `);

    // Add performance indexes
    await queryRunner.createIndex(
      "appointments",
      new TableIndex({ name: "IDX_appointments_hospital_id", columnNames: ["hospital_id"] }),
    );
    await queryRunner.createIndex(
      "appointments",
      new TableIndex({ name: "IDX_appointments_patient_id", columnNames: ["patient_id"] }),
    );
    await queryRunner.createIndex(
      "appointments",
      new TableIndex({ name: "IDX_appointments_doctor_id", columnNames: ["doctor_id"] }),
    );
    await queryRunner.createIndex(
      "appointments",
      new TableIndex({ name: "IDX_appointments_scheduled_time", columnNames: ["scheduled_time"] }),
    );

    // ═══════════════════════════════════════════════════════════════════════
    // 2. encounters table
    // ═══════════════════════════════════════════════════════════════════════
    await queryRunner.addColumn(
      "encounters",
      new TableColumn({ name: "hospital_id", type: "uuid", isNullable: true }),
    );
    await queryRunner.addColumn(
      "encounters",
      new TableColumn({ name: "created_by", type: "uuid", isNullable: true }),
    );
    await queryRunner.addColumn(
      "encounters",
      new TableColumn({ name: "updated_by", type: "uuid", isNullable: true }),
    );
    await queryRunner.addColumn(
      "encounters",
      new TableColumn({ name: "deleted_at", type: "timestamptz", isNullable: true }),
    );
    await queryRunner.addColumn(
      "encounters",
      new TableColumn({ name: "version", type: "integer", isNullable: false, default: 1 }),
    );

    await queryRunner.query(`
      UPDATE encounters SET hospital_id = (SELECT id FROM hospitals LIMIT 1)
      WHERE hospital_id IS NULL
    `);
    await queryRunner.query(`ALTER TABLE encounters ALTER COLUMN hospital_id SET NOT NULL`);

    // Rename camelCase → snake_case for encounters
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN "patientId" TO patient_id`);
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN "doctorId" TO doctor_id`);
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN "appointmentId" TO appointment_id`);
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN "chiefComplaint" TO chief_complaint`);
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN "updatedAt" TO updated_at`);

    await queryRunner.createIndex(
      "encounters",
      new TableIndex({ name: "IDX_encounters_hospital_id", columnNames: ["hospital_id"] }),
    );
    await queryRunner.createIndex(
      "encounters",
      new TableIndex({ name: "IDX_encounters_patient_id", columnNames: ["patient_id"] }),
    );

    // ═══════════════════════════════════════════════════════════════════════
    // 3. soap_notes table
    // ═══════════════════════════════════════════════════════════════════════
    await queryRunner.query(`ALTER TABLE soap_notes RENAME COLUMN "signedBy" TO signed_by`);
    await queryRunner.query(`ALTER TABLE soap_notes RENAME COLUMN "signedAt" TO signed_at`);
    await queryRunner.query(`ALTER TABLE soap_notes RENAME COLUMN "createdAt" TO created_at`);
    await queryRunner.query(`ALTER TABLE soap_notes RENAME COLUMN "updatedAt" TO updated_at`);

    // ═══════════════════════════════════════════════════════════════════════
    // 4. vital_signs table
    // NOTE: spo2 is ALREADY lowercase in the DB — skip renaming it
    // ═══════════════════════════════════════════════════════════════════════
    await queryRunner.query(`ALTER TABLE vital_signs RENAME COLUMN "bpSystolic" TO bp_systolic`);
    await queryRunner.query(`ALTER TABLE vital_signs RENAME COLUMN "bpDiastolic" TO bp_diastolic`);
    await queryRunner.query(`ALTER TABLE vital_signs RENAME COLUMN "heartRate" TO heart_rate`);
    await queryRunner.query(`ALTER TABLE vital_signs RENAME COLUMN "respiratoryRate" TO respiratory_rate`);
    await queryRunner.query(`ALTER TABLE vital_signs RENAME COLUMN "recordedAt" TO recorded_at`);

    // ═══════════════════════════════════════════════════════════════════════
    // 5. invoices — rename remaining camelCase columns + fix cross-tenant unique
    // ═══════════════════════════════════════════════════════════════════════
    // Rename camelCase columns to snake_case
    await queryRunner.query(`ALTER TABLE invoices RENAME COLUMN "invoiceNumber" TO invoice_number`);
    await queryRunner.query(`ALTER TABLE invoices RENAME COLUMN "taxTotal" TO tax_total`);
    await queryRunner.query(`ALTER TABLE invoices RENAME COLUMN "discountTotal" TO discount_total`);
    await queryRunner.query(`ALTER TABLE invoices RENAME COLUMN "grandTotal" TO grand_total`);
    await queryRunner.query(`ALTER TABLE invoices RENAME COLUMN "amountPaid" TO amount_paid`);
    await queryRunner.query(`ALTER TABLE invoices RENAME COLUMN "dueDate" TO due_date`);

    // Drop any global unique constraint on invoiceNumber (try all possible auto-generated names)
    await queryRunner.query(`
      DO $$
      DECLARE
        _cname text;
      BEGIN
        SELECT conname INTO _cname
          FROM pg_constraint
          WHERE conrelid = 'invoices'::regclass
            AND contype = 'u'
          LIMIT 1;
        IF _cname IS NOT NULL THEN
          EXECUTE 'ALTER TABLE invoices DROP CONSTRAINT "' || _cname || '"';
        END IF;
      END $$;
    `);

    // Add per-hospital composite unique index
    await queryRunner.createIndex(
      "invoices",
      new TableIndex({
        name: "IDX_invoices_hospital_invoice_number",
        columnNames: ["hospital_id", "invoice_number"],
        isUnique: true,
      }),
    );

    // ═══════════════════════════════════════════════════════════════════════
    // 6. prescriptions — rename camelCase columns + fix cross-tenant unique
    // ═══════════════════════════════════════════════════════════════════════
    await queryRunner.query(`ALTER TABLE prescriptions RENAME COLUMN "rxNumber" TO rx_number`);
    await queryRunner.query(`ALTER TABLE prescriptions RENAME COLUMN "drugName" TO drug_name`);
    await queryRunner.query(`ALTER TABLE prescriptions RENAME COLUMN "prescriberName" TO prescriber_name`);
    await queryRunner.query(`ALTER TABLE prescriptions RENAME COLUMN "interactionAlert" TO interaction_alert`);
    await queryRunner.query(`ALTER TABLE prescriptions RENAME COLUMN "interactionDetails" TO interaction_details`);

    // Drop global unique constraint on rxNumber if it exists
    await queryRunner.query(`
      DO $$
      DECLARE
        _cname text;
      BEGIN
        SELECT conname INTO _cname
          FROM pg_constraint
          WHERE conrelid = 'prescriptions'::regclass
            AND contype = 'u'
          LIMIT 1;
        IF _cname IS NOT NULL THEN
          EXECUTE 'ALTER TABLE prescriptions DROP CONSTRAINT "' || _cname || '"';
        END IF;
      END $$;
    `);

    // Add per-hospital composite unique index
    await queryRunner.createIndex(
      "prescriptions",
      new TableIndex({
        name: "IDX_prescriptions_hospital_rx_number",
        columnNames: ["hospital_id", "rx_number"],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Prescriptions
    await queryRunner.dropIndex("prescriptions", "IDX_prescriptions_hospital_rx_number");

    // Invoices
    await queryRunner.dropIndex("invoices", "IDX_invoices_hospital_invoice_number");

    // vital_signs — restore camelCase (reverse of up)
    await queryRunner.query(`ALTER TABLE vital_signs RENAME COLUMN recorded_at TO "recordedAt"`);
    await queryRunner.query(`ALTER TABLE vital_signs RENAME COLUMN respiratory_rate TO "respiratoryRate"`);
    await queryRunner.query(`ALTER TABLE vital_signs RENAME COLUMN heart_rate TO "heartRate"`);
    await queryRunner.query(`ALTER TABLE vital_signs RENAME COLUMN bp_diastolic TO "bpDiastolic"`);
    await queryRunner.query(`ALTER TABLE vital_signs RENAME COLUMN bp_systolic TO "bpSystolic"`);

    // soap_notes
    await queryRunner.query(`ALTER TABLE soap_notes RENAME COLUMN updated_at TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE soap_notes RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE soap_notes RENAME COLUMN signed_at TO "signedAt"`);
    await queryRunner.query(`ALTER TABLE soap_notes RENAME COLUMN signed_by TO "signedBy"`);

    // encounters
    await queryRunner.dropIndex("encounters", "IDX_encounters_patient_id");
    await queryRunner.dropIndex("encounters", "IDX_encounters_hospital_id");
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN updated_at TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN chief_complaint TO "chiefComplaint"`);
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN appointment_id TO "appointmentId"`);
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN doctor_id TO "doctorId"`);
    await queryRunner.query(`ALTER TABLE encounters RENAME COLUMN patient_id TO "patientId"`);
    await queryRunner.dropColumn("encounters", "version");
    await queryRunner.dropColumn("encounters", "deleted_at");
    await queryRunner.dropColumn("encounters", "updated_by");
    await queryRunner.dropColumn("encounters", "created_by");
    await queryRunner.dropColumn("encounters", "hospital_id");

    // appointments
    await queryRunner.dropIndex("appointments", "IDX_appointments_scheduled_time");
    await queryRunner.dropIndex("appointments", "IDX_appointments_doctor_id");
    await queryRunner.dropIndex("appointments", "IDX_appointments_patient_id");
    await queryRunner.dropIndex("appointments", "IDX_appointments_hospital_id");
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN updated_at TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN created_at TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN duration_minutes TO "durationMinutes"`);
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN doctor_id TO "doctorId"`);
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN patient_id TO "patientId"`);
    await queryRunner.query(`ALTER TABLE appointments RENAME COLUMN scheduled_time TO "scheduledTime"`);
    await queryRunner.dropColumn("appointments", "version");
    await queryRunner.dropColumn("appointments", "deleted_at");
    await queryRunner.dropColumn("appointments", "updated_by");
    await queryRunner.dropColumn("appointments", "created_by");
    await queryRunner.dropColumn("appointments", "hospital_id");
  }
}
