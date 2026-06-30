import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Ward } from "./entities/ward.entity";
import { Bed } from "./entities/bed.entity";
import { BedAdmission } from "./entities/bed-admission.entity";
import { BedsService } from "./beds.service";
import { BedsController } from "./beds.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Ward, Bed, BedAdmission])],
  controllers: [BedsController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule {}
