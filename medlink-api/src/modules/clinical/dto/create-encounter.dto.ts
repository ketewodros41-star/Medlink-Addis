import { IsUUID, IsOptional, IsString, IsEnum } from "class-validator";
import { AppointmentType } from "../../appointments/entities/appointment.entity";

export class CreateEncounterDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  doctorId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  encounterType?: AppointmentType;
}
