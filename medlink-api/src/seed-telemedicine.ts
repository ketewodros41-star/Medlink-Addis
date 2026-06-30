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

    const patients = await dataSource.query(`SELECT id, "date_of_birth", mrn FROM patients LIMIT 1`);
    if (patients.length === 0) {
      console.log('No patient found, please run seed.ts first');
      return;
    }
    const patientId = patients[0].id;

    const users = await dataSource.query(`SELECT id FROM users LIMIT 1`);
    if (users.length === 0) {
      console.log('No doctor user found, please run seed.ts first');
      return;
    }
    const doctorId = users[0].id;

    const sessions = await dataSource.query(`SELECT id FROM telemedicine_sessions LIMIT 1`);
    if (sessions.length > 0) {
      console.log('Telemedicine data already seeded');
      return;
    }

    console.log('Seeding telemedicine session...');
    const sessionRes = await dataSource.query(`
      INSERT INTO telemedicine_sessions (hospital_id, patient_id, "doctorId", status, "roomUrl", "startedAt", version) VALUES
      ('${hospitalId}', '${patientId}', '${doctorId}', 'Active', 'https://meet.jit.si/medlink-addis-tigist-alemu', NOW(), 1)
      RETURNING id
    `);
    const sessionId = sessionRes[0].id;

    console.log('Seeding chat messages...');
    await dataSource.query(`
      INSERT INTO telemedicine_chat_messages (hospital_id, session_id, "senderType", text, version) VALUES
      ('${hospitalId}', '${sessionId}', 'patient', 'Good morning doctor, I have been having chest pains since yesterday evening.', 1),
      ('${hospitalId}', '${sessionId}', 'doctor', 'Good morning. I can see your vitals from the wearable data. When did the pain start exactly and what does it feel like?', 1),
      ('${hospitalId}', '${sessionId}', 'patient', 'Around 7pm. Its a tightness in the center of my chest, maybe a 6 out of 10.', 1),
      ('${hospitalId}', '${sessionId}', 'doctor', 'I would like to order an ECG at your nearest clinic today. I will also adjust your medication — I am sending the prescription now.', 1)
    `);

    console.log('Telemedicine data seeded successfully');
  } catch (err: any) {
    console.error('Seeding telemedicine failed:', err.message);
  } finally {
    await app.close();
  }
}

bootstrap();
