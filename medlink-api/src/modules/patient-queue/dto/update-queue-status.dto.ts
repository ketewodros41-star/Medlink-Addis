import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateQueueStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsOptional()
  currentDept?: string;
}
