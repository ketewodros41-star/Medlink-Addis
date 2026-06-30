import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Encounter } from './encounter.entity';

@Entity('soap_notes')
export class SoapNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: true })
  subjective!: string;

  @Column({ type: 'text', nullable: true })
  objective!: string;

  @Column({ type: 'text', nullable: true })
  assessment!: string;

  @Column({ type: 'text', nullable: true })
  plan!: string;

  @Column({ type: 'jsonb', nullable: true })
  diagnoses!: { code: string; type: string }[]; // Array of ICD-10 objects

  @Column({ name: 'signed_by', type: 'uuid', nullable: true })
  signedBy!: string;

  @Column({ name: 'signed_at', type: 'timestamp', nullable: true })
  signedAt!: Date;

  @OneToOne(() => Encounter, encounter => encounter.soapNote)
  encounter!: Encounter;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
