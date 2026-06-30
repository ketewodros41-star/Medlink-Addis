import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { TelemedicineService } from "./telemedicine.service";
import { ChatSenderType } from "./entities/telemedicine-chat.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/types/jwt-payload.type";

@Controller("telemedicine")
@UseGuards(JwtAuthGuard)
export class TelemedicineController {
  constructor(private readonly telemedicineService: TelemedicineService) {}

  @Get("sessions/active")
  async getActiveSession(@CurrentUser() user: JwtPayload) {
    const session = await this.telemedicineService.findActiveSession(user.hospital_id);
    return { data: session };
  }

  @Get("sessions/:id/chat")
  async getChatMessages(
    @Param("id") sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.telemedicineService.findChatMessages(sessionId, user.hospital_id);
    return { data };
  }

  @Post("sessions/:id/chat")
  async createChatMessage(
    @Param("id") sessionId: string,
    @Body("senderType") senderType: ChatSenderType,
    @Body("text") text: string,
    @CurrentUser() user: JwtPayload
  ) {
    const data = await this.telemedicineService.createChatMessage(sessionId, senderType, text, user.hospital_id);
    return { data };
  }

  @Post("sessions/:id/prescription")
  async createPrescription(
    @Param("id") sessionId: string,
    @Body("patientId") patientId: string,
    @Body("drugName") drugName: string,
    @Body("sig") sig: string,
    @Body("qty") qty: number,
    @Body("prescriberName") prescriberName: string,
    @CurrentUser() user: JwtPayload
  ) {
    const data = await this.telemedicineService.createPrescription(
      user.hospital_id,
      patientId,
      drugName,
      sig,
      qty,
      prescriberName
    );
    return { data };
  }
}
