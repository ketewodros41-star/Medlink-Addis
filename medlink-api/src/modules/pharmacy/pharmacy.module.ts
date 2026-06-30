import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Prescription } from "./entities/prescription.entity";
import { InventoryItem } from "./entities/inventory-item.entity";
import { PharmacyService } from "./pharmacy.service";
import { PharmacyController } from "./pharmacy.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Prescription, InventoryItem])],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
