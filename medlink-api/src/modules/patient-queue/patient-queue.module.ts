import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QueueEntry } from "./entities/queue-entry.entity";
import { PatientQueueService } from "./patient-queue.service";
import { PatientQueueController } from "./patient-queue.controller";

@Module({
  imports: [TypeOrmModule.forFeature([QueueEntry])],
  controllers: [PatientQueueController],
  providers: [PatientQueueService],
  exports: [PatientQueueService],
})
export class PatientQueueModule {}
