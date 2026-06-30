import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const hospitals = await dataSource.query(`SELECT id FROM hospitals LIMIT 1`);
    if (hospitals.length === 0) {
      console.log('No hospital found, please run seed.ts first');
      return;
    }
    const hospitalId = hospitals[0].id;

    const patients = await dataSource.query(`SELECT id FROM patients LIMIT 1`);
    if (patients.length === 0) {
      console.log('No patient found, please run seed.ts first');
      return;
    }
    const patientId = patients[0].id;

    const items = await dataSource.query(`SELECT id FROM inventory_items WHERE "drugName" = 'Paracetamol 500mg'`);
    if (items.length > 0) {
      console.log('Pharmacy data already seeded');
      return;
    }

    console.log('Seeding pharmacy inventory...');
    await dataSource.query(`
      INSERT INTO inventory_items (hospital_id, "drugName", stock, "reorderLevel", "expiryDate", status, version) VALUES
      ('${hospitalId}', 'Paracetamol 500mg', 2400, 500, '2028-01-01 00:00:00', 'OK', 1),
      ('${hospitalId}', 'Amoxicillin 500mg', 180, 200, '2026-08-01 00:00:00', 'Low', 1),
      ('${hospitalId}', 'Warfarin 5mg', 840, 300, '2027-03-01 00:00:00', 'OK', 1),
      ('${hospitalId}', 'Morphine 10mg/mL', 60, 100, '2025-11-01 00:00:00', 'Critical', 1)
    `);

    console.log('Seeding prescriptions...');
    await dataSource.query(`
      INSERT INTO prescriptions (hospital_id, rx_number, patient_id, drug_name, sig, qty, prescriber_name, status, interaction_alert, interaction_details, version) VALUES
      ('${hospitalId}', 'RX-5521', '${patientId}', 'Atenolol 50mg', '1 tab PO QD', 30, 'Dr. Habtamu', 'Ready', false, null, 1),
      ('${hospitalId}', 'RX-5522', '${patientId}', 'Warfarin 5mg', '1 tab PO QD', 30, 'Dr. Yonas', 'Hold', true, 'Warfarin + Aspirin: Bleeding risk', 1),
      ('${hospitalId}', 'RX-5523', '${patientId}', 'Oxytocin 10IU/mL', 'IV infusion', 5, 'Dr. Selam', 'Dispensed', false, null, 1),
      ('${hospitalId}', 'RX-5524', '${patientId}', 'Tramadol 50mg', '1 tab PO TID', 21, 'Dr. Habtamu', 'Pending', false, null, 1)
    `);

    console.log('Pharmacy data seeded successfully');
  } catch (err: any) {
    console.error('Seeding pharmacy failed:', err.message);
  } finally {
    await app.close();
  }
}

bootstrap();
