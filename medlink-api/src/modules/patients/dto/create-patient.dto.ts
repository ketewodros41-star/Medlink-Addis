import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from "class-validator";
import { PatientGender } from "../entities/patient.entity";

export class CreatePatientDto {
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MaxLength(80)
  lastName!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsEnum(PatientGender)
  gender!: PatientGender;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nationalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  passportNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  bloodType?: string;

  @IsOptional()
  @IsPhoneNumber()
  primaryPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  primaryEmail?: string;
}
