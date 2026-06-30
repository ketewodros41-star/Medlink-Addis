import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { TenantBaseEntity } from "../../../core/database/base.entity";
import { TelemedicineSession } from "./telemedicine-session.entity";

export enum ChatSenderType {
  DOCTOR = "doctor",
  PATIENT = "patient",
}

@Entity("telemedicine_chat_messages")
export class TelemedicineChatMessage extends TenantBaseEntity {
  @Column({ name: "session_id" })
  sessionId!: string;

  @ManyToOne(() => TelemedicineSession, { onDelete: "CASCADE" })
  @JoinColumn({ name: "session_id" })
  session!: TelemedicineSession;

  @Column({ type: "enum", enum: ChatSenderType })
  senderType!: ChatSenderType;

  @Column({ type: "text" })
  text!: string;
}
