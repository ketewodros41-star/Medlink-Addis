import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HospitalEntity } from "./entities/hospital.entity";
import { HospitalsService } from "./hospitals.service";

@Module({
  imports: [TypeOrmModule.forFeature([HospitalEntity])],
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule {}
