import { IsOptional, IsString, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class DiagnosisDto {
  @IsString()
  code!: string; // ICD-10 code, e.g. "J18.9"

  @IsString()
  type!: string; // "primary" | "secondary"
}

export class UpdateSoapNoteDto {
  @IsOptional()
  @IsString()
  subjective?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  diagnoses?: DiagnosisDto[];
}
