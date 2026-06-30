import { IsIn, IsOptional, IsString, IsUrl } from "class-validator";

export class ImportSourceFileDto {
  @IsIn(["cdc-icd10-cm", "rxnorm-prescribable", "loinc", "medlineplus"])
  sourceType!: "cdc-icd10-cm" | "rxnorm-prescribable" | "loinc" | "medlineplus";

  @IsString()
  version!: string;

  @IsString()
  sourceName!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsString()
  content!: string;
}
