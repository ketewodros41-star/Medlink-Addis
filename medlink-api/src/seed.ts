import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    // Insert Hospital
    const hospitalRes = await dataSource.query(`INSERT INTO hospitals (name, code, version) VALUES ('MedLink General', 'MLG', 1) RETURNING id`);
    const hospitalId = hospitalRes[0].id;

    // Insert User
    const userRes = await dataSource.query(`INSERT INTO users (hospital_id, email, first_name, last_name, password_hash, version) VALUES ('${hospitalId}', 'admin@medlink.com', 'Admin', 'User', 'scrypt$Gskul-GI5LHUU4y8nFbdRw$YvPx9cSHNpvZxZUXObvikLpzTFyqd5BB9nWFnji0BSIv-6WMC3j4pLFbOhHKeup8FVwAej5Z5CFhDNeuBhdJgQ', 1) RETURNING id`);
    const userId = userRes[0].id;

    // Insert Hospital Admin Role
    const roleRes = await dataSource.query(`INSERT INTO roles (hospital_id, name, description, is_system_role, version) VALUES ('${hospitalId}', 'hospital_admin', 'Hospital Administrator', true, 1) RETURNING id`);
    const roleId = roleRes[0].id;

    // Map Admin User to Hospital Admin Role
    await dataSource.query(`INSERT INTO user_roles (user_id, role_id) VALUES ('${userId}', '${roleId}')`);

    // Insert Patient
    const patientRes = await dataSource.query(`INSERT INTO patients (hospital_id, mrn, first_name, last_name, date_of_birth, version) VALUES ('${hospitalId}', 'MRN-001', 'Tigist', 'Alemu', '1990-03-12', 1) RETURNING id`);
    const patientId = patientRes[0].id;

    // Insert Appointment
    await dataSource.query(`INSERT INTO appointments (hospital_id, patient_id, doctor_id, scheduled_time, version) VALUES ('${hospitalId}', '${patientId}', '${userId}', '2026-07-01 10:00:00', 1)`);

    console.log('Seed completed successfully. Hospital ID:', hospitalId);
  } catch (err: any) {
    console.error('Seeding failed (might already be seeded):', err.message);
  }
  
  await app.close();
}
bootstrap();
