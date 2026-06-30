import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TelemedicineSession } from "./entities/telemedicine-session.entity";
import { TelemedicineChatMessage } from "./entities/telemedicine-chat.entity";
import { TelemedicineService } from "./telemedicine.service";
import { TelemedicineController } from "./telemedicine.controller";

@Module({
  imports: [TypeOrmModule.forFeature([TelemedicineSession, TelemedicineChatMessage])],
  controllers: [TelemedicineController],
  providers: [TelemedicineService],
  exports: [TelemedicineService],
})
export class TelemedicineModule {}
