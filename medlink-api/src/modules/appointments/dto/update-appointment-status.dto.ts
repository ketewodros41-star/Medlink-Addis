import { IsEnum, IsOptional, IsString } from "class-validator";
import { AppointmentStatus } from "../entities/appointment.entity";

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus, {
    message: `status must be one of: ${Object.values(AppointmentStatus).join(", ")}`,
  })
  status!: AppointmentStatus;
}
