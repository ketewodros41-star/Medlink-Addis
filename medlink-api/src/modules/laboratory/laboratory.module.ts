import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LabOrder } from "./entities/lab-order.entity";
import { LaboratoryService } from "./laboratory.service";
import { LaboratoryController } from "./laboratory.controller";

@Module({
  imports: [TypeOrmModule.forFeature([LabOrder])],
  controllers: [LaboratoryController],
  providers: [LaboratoryService],
  exports: [LaboratoryService],
})
export class LaboratoryModule {}
