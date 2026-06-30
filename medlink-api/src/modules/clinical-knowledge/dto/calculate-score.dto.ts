import { IsObject } from "class-validator";

export class CalculateScoreDto {
  @IsObject()
  inputs!: Record<string, number | boolean | string>;
}
