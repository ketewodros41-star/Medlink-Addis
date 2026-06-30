import { IsEnum, IsInt, IsOptional, Min, Max } from "class-validator";
import { TriageStatus } from "../entities/triage-entry.entity";

export class UpdateTriageStatusDto {
  @IsEnum(TriageStatus)
  @IsOptional()
  status?: TriageStatus;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;
}
