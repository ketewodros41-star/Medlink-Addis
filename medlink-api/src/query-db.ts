import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { PasswordService } from './core/security/password.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const passwords = app.get(PasswordService);
  
  try {
    const userRes = await dataSource.query(`SELECT password_hash FROM users WHERE email = 'admin@medlink.com'`);
    if (userRes.length === 0) {
      console.log('User not found in DB!');
    } else {
      const storedHash = userRes[0].password_hash;
      console.log('Stored Hash:', storedHash);
      
      const verifyResult1 = await passwords.verify('password123', storedHash);
      console.log('Verify "password123":', verifyResult1);
    }

  } catch (err: any) {
    console.error('Verify script failed:', err.message);
  }
  
  await app.close();
}
bootstrap();
