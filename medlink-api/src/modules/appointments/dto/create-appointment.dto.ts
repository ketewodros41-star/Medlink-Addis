import { IsUUID, IsDateString, IsInt, IsOptional, IsString, IsEnum, Min, Max } from "class-validator";
import { AppointmentType } from "../entities/appointment.entity";

export class CreateAppointmentDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  doctorId!: string;

  @IsDateString()
  scheduledTime!: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @IsOptional()
  @IsEnum(AppointmentType, {
    message: `type must be one of: ${Object.values(AppointmentType).join(", ")}`,
  })
  type?: AppointmentType;

  @IsOptional()
  @IsString()
  notes?: string;
}
