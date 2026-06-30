import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export type KnowledgeDomain =
  | "all"
  | "diseases"
  | "symptoms"
  | "medications"
  | "labs"
  | "imaging"
  | "procedures"
  | "guidelines";

export class ClinicalKnowledgeQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @IsIn(["all", "diseases", "symptoms", "medications", "labs", "imaging", "procedures", "guidelines"])
  domain: KnowledgeDomain = "all";

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
