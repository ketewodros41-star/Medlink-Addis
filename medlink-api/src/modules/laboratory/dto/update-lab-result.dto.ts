import { IsEnum, IsString, IsOptional } from "class-validator";
import { LabOrderStatus } from "../entities/lab-order.entity";

export class UpdateLabResultDto {
  @IsString()
  @IsOptional()
  result?: string;

  @IsEnum(LabOrderStatus)
  @IsOptional()
  status?: LabOrderStatus;

  @IsString()
  @IsOptional()
  criticalNotes?: string;
}
