import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TriageEntry } from "./entities/triage-entry.entity";
import { EmergencyService } from "./emergency.service";
import { EmergencyController } from "./emergency.controller";

@Module({
  imports: [TypeOrmModule.forFeature([TriageEntry])],
  controllers: [EmergencyController],
  providers: [EmergencyService],
  exports: [EmergencyService],
})
export class EmergencyModule {}
