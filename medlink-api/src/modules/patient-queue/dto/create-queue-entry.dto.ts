import { IsUUID, IsString, IsNotEmpty } from "class-validator";

export class CreateQueueEntryDto {
  @IsUUID()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  currentDept!: string;
}
