import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PatientEntity } from "./entities/patient.entity";
import { PatientTimeline } from "./entities/timeline.entity";
import { PatientsController } from "./patients.controller";
import { PatientsService } from "./patients.service";
import { TimelineService } from "./timeline.service";

@Module({
  imports: [TypeOrmModule.forFeature([PatientEntity, PatientTimeline])],
  controllers: [PatientsController],
  providers: [PatientsService, TimelineService],
  exports: [PatientsService, TimelineService],
})
export class PatientsModule {}
