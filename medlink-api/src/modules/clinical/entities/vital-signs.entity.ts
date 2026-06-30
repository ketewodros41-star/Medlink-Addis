import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { Encounter } from './encounter.entity';

@Entity('vital_signs')
export class VitalSigns {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bp_systolic', type: 'int', nullable: true })
  bpSystolic!: number;

  @Column({ name: 'bp_diastolic', type: 'int', nullable: true })
  bpDiastolic!: number;

  @Column({ name: 'heart_rate', type: 'int', nullable: true })
  heartRate!: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature!: number; // Celsius

  @Column({ type: 'int', nullable: true })
  spo2!: number;

  @Column({ name: 'respiratory_rate', type: 'int', nullable: true })
  respiratoryRate!: number;

  @OneToOne(() => Encounter, encounter => encounter.vitalSigns)
  encounter!: Encounter;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt!: Date;
}
