import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { DatabaseModule } from "./core/database/database.module";
import { RedisModule } from "./core/redis/redis.module";
import { SecurityModule } from "./core/security/security.module";
import { RequestIdMiddleware } from "./core/common/middleware/request-id.middleware";
import { appConfig } from "./core/config/app.config";
import { authConfig } from "./core/config/auth.config";
import { databaseConfig } from "./core/config/database.config";
import { redisConfig } from "./core/config/redis.config";
import { validationSchema } from "./core/config/validation.schema";
import { HealthModule } from "./core/health/health.module";
import { EventsModule } from "./core/events/events.module";
import { QueueModule } from "./core/queue/queue.module";
import { LoggingModule } from "./core/logging/logging.module";
import { AuditModule } from "./core/audit/audit.module";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { ClinicalModule } from "./modules/clinical/clinical.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PatientsModule } from "./modules/patients/patients.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { UsersModule } from "./modules/users/users.module";
import { BillingModule } from "./modules/billing/billing.module";
import { PharmacyModule } from "./modules/pharmacy/pharmacy.module";
import { TelemedicineModule } from "./modules/telemedicine/telemedicine.module";
import { HospitalsModule } from "./modules/hospitals/hospitals.module";
import { LaboratoryModule } from "./modules/laboratory/laboratory.module";
import { EmergencyModule } from "./modules/emergency/emergency.module";
import { PatientQueueModule } from "./modules/patient-queue/patient-queue.module";
import { BedsModule } from "./modules/beds/beds.module";
import { AiModule } from "./modules/ai/ai.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ClinicalKnowledgeModule } from "./modules/clinical-knowledge/clinical-knowledge.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, redisConfig],
      validationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL_SECONDS ?? 60) * 1000,
        limit: Number(process.env.RATE_LIMIT_MAX ?? 100),
      },
    ]),
    DatabaseModule,
    RedisModule,
    SecurityModule,
    HealthModule,
    EventsModule,
    QueueModule,
    LoggingModule,
    AuditModule,
    AppointmentsModule,
    ClinicalModule,
    AuthModule,
    UsersModule,
    PermissionsModule,
    PatientsModule,
    BillingModule,
    PharmacyModule,
    TelemedicineModule,
    HospitalsModule,
    LaboratoryModule,
    EmergencyModule,
    PatientQueueModule,
    BedsModule,
    AiModule,
    DashboardModule,
    ClinicalKnowledgeModule,
  ],
  providers: [
    // Global rate-limiting guard — enforces ThrottlerModule config on ALL routes
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
