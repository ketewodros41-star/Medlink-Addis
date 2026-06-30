import { IsUUID, IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateLabOrderDto {
  @IsUUID()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  testName!: string;

  @IsUUID()
  @IsOptional()
  encounterId?: string;
}
