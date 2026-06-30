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

    // Check if invoices already exist to prevent duplicate seed issues
    const invoices = await dataSource.query(`SELECT id FROM invoices WHERE invoice_number = 'INV-001'`);
    if (invoices.length > 0) {
      console.log('Billing data already seeded');
      return;
    }

    console.log('Seeding billing data...');

    // Insert Invoice 1 (Paid)
    const inv1Res = await dataSource.query(`INSERT INTO invoices (patient_id, hospital_id, invoice_number, status, subtotal, tax_total, discount_total, grand_total, amount_paid, version) VALUES ('${patientId}', '${hospitalId}', 'INV-001', 'Paid', 3200, 480, 0, 3680, 3680, 1) RETURNING id`);
    const inv1Id = inv1Res[0].id;
    await dataSource.query(`INSERT INTO invoice_items (invoice_id, hospital_id, description, quantity, "unitPrice", "taxRate", total, version) VALUES ('${inv1Id}', '${hospitalId}', 'Cardiology Consultation', 1, 3200, 15, 3680, 1)`);
    await dataSource.query(`INSERT INTO payments (invoice_id, hospital_id, amount, method, "referenceNumber", version) VALUES ('${inv1Id}', '${hospitalId}', 3680, 'Card', 'TXN-998822', 1)`);

    // Insert Invoice 2 (Unpaid)
    const inv2Res = await dataSource.query(`INSERT INTO invoices (patient_id, hospital_id, invoice_number, status, subtotal, tax_total, discount_total, grand_total, amount_paid, version) VALUES ('${patientId}', '${hospitalId}', 'INV-002', 'Unpaid', 12800, 1920, 0, 14720, 0, 1) RETURNING id`);
    const inv2Id = inv2Res[0].id;
    await dataSource.query(`INSERT INTO invoice_items (invoice_id, hospital_id, description, quantity, "unitPrice", "taxRate", total, version) VALUES ('${inv2Id}', '${hospitalId}', 'Emergency Admission', 1, 12800, 15, 14720, 1)`);

    console.log('Billing data seeded successfully');
  } catch (err: any) {
    console.error('Seeding billing failed:', err.message);
  } finally {
    await app.close();
  }
}

bootstrap();
