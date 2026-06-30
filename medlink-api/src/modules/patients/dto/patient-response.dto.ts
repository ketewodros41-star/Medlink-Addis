import { Expose } from 'class-transformer';

export class PatientResponseDto {
  @Expose() id!: string;
  @Expose() hospitalId!: string;
  @Expose() mrn!: string;
  @Expose() firstName!: string;
  @Expose() lastName!: string;
  @Expose() dateOfBirth!: string;
  @Expose() gender!: string;
  @Expose() bloodType!: string | null;
  @Expose() primaryPhone!: string | null;
  @Expose() primaryEmail!: string | null;
  @Expose() nationalId!: string | null;
  @Expose() passportNumber!: string | null;
  @Expose() allergies!: Array<{ substance: string; severity: string; reaction?: string }>;
  @Expose() medicalFlags!: Array<{ type: string; priority: string; note?: string }>;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
