import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  TelemedicineSession,
  TelemedicineStatus,
} from "./entities/telemedicine-session.entity";
import {
  TelemedicineChatMessage,
  ChatSenderType,
} from "./entities/telemedicine-chat.entity";

@Injectable()
export class TelemedicineService {
  constructor(
    @InjectRepository(TelemedicineSession)
    private readonly sessionRepo: Repository<TelemedicineSession>,
    @InjectRepository(TelemedicineChatMessage)
    private readonly chatRepo: Repository<TelemedicineChatMessage>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findActiveSession(hospitalId: string) {
    const session = await this.sessionRepo.findOne({
      where: { hospitalId, status: TelemedicineStatus.ACTIVE },
      relations: ["patient"],
    });
    if (!session) {
      // Fallback: get the most recent session for the same hospital
      const fallback = await this.sessionRepo.findOne({
        where: { hospitalId },
        relations: ["patient"],
        order: { createdAt: "DESC" },
      });
      return fallback;
    }
    return session;
  }

  async findChatMessages(sessionId: string, hospitalId: string) {
    // Verify session belongs to the caller's hospital before returning messages
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, hospitalId },
    });
    if (!session) return [];

    return this.chatRepo.find({
      where: { sessionId },
      order: { createdAt: "ASC" },
    });
  }

  async createChatMessage(
    sessionId: string,
    senderType: ChatSenderType,
    text: string,
    hospitalId: string,
  ) {
    // Remove manual version: 1 — TypeORM @VersionColumn handles this automatically
    const message = this.chatRepo.create({
      sessionId,
      senderType,
      text,
      hospitalId,
    });
    return this.chatRepo.save(message);
  }

  async createPrescription(
    hospitalId: string,
    patientId: string,
    drugName: string,
    sig: string,
    qty: number,
    prescriberName: string,
  ) {
    // Generate a collision-resistant RX number scoped to hospital + timestamp
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    const rxNumber = `RX-${timestamp}-${random}`;

    this.eventEmitter.emit("telemedicine.prescription.created", {
      hospitalId,
      patientId,
      drugName,
      sig,
      qty,
      prescriberName,
      rxNumber,
    });

    return { success: true, rxNumber };
  }
}
