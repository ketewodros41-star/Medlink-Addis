import { IsUUID, IsString, IsNotEmpty, IsInt, IsOptional, Min, Max } from "class-validator";

export class CreateTriageEntryDto {
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsNotEmpty()
  patientName!: string;

  @IsInt()
  @Min(0)
  age!: number;

  @IsString()
  @IsNotEmpty()
  gender!: string;

  @IsString()
  @IsNotEmpty()
  complaint!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  priority!: number;
}
