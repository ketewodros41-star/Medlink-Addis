import { IsArray, IsIn, IsOptional, IsString, IsUrl, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class ImportSourceDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  url?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;
}

export class ImportClinicalContentDto {
  @IsIn(["diseases", "symptoms", "medications", "labs", "imaging", "procedures", "guidelines"])
  dataset!: string;

  @IsString()
  version!: string;

  @ValidateNested()
  @Type(() => ImportSourceDto)
  source!: ImportSourceDto;

  @IsArray()
  records!: Record<string, unknown>[];
}
