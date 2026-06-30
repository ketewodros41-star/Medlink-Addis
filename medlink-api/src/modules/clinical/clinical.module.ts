import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalService } from './clinical.service';
import { ClinicalController } from './clinical.controller';
import { Encounter } from './entities/encounter.entity';
import { VitalSigns } from './entities/vital-signs.entity';
import { SoapNote } from './entities/soap-note.entity';
import { ClinicalDisease } from './entities/clinical-disease.entity';
import { PatientEntity } from '../patients/entities/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Encounter, VitalSigns, SoapNote, ClinicalDisease, PatientEntity])],
  controllers: [ClinicalController],
  providers: [ClinicalService],
  exports: [ClinicalService],
})
export class ClinicalModule {}

