import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class RecordVitalsDto {
  @IsOptional() @IsInt() bpSystolic?: number;
  @IsOptional() @IsInt() bpDiastolic?: number;
  @IsOptional() @IsInt() @Min(30) @Max(250) heartRate?: number;
  @IsOptional() @IsNumber() temperature?: number;
  @IsOptional() @IsInt() @Min(60) @Max(100) spo2?: number;
  @IsOptional() @IsInt() respiratoryRate?: number;
}
