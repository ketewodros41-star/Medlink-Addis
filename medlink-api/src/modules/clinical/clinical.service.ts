import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Encounter, EncounterStatus } from "./entities/encounter.entity";
import { VitalSigns } from "./entities/vital-signs.entity";
import { SoapNote } from "./entities/soap-note.entity";
import { ClinicalDisease } from "./entities/clinical-disease.entity";
import { CreateEncounterDto } from "./dto/create-encounter.dto";
import { UpdateSoapNoteDto } from "./dto/update-soap-note.dto";
import { RecordVitalsDto } from "./dto/record-vitals.dto";

@Injectable()
export class ClinicalService {
  constructor(
    @InjectRepository(Encounter)
    private encounterRepo: Repository<Encounter>,
    @InjectRepository(VitalSigns)
    private vitalsRepo: Repository<VitalSigns>,
    @InjectRepository(SoapNote)
    private soapRepo: Repository<SoapNote>,
    @InjectRepository(ClinicalDisease)
    private diseaseRepo: Repository<ClinicalDisease>,
    private readonly eventEmitter: EventEmitter2,
  ) {}


  async createEncounter(dto: CreateEncounterDto, hospitalId: string, actorId: string): Promise<Encounter> {
    const encounter = this.encounterRepo.create({ ...dto, hospitalId, createdBy: actorId, updatedBy: actorId });
    const saved = await this.encounterRepo.save(encounter);
    this.eventEmitter.emit("clinical.encounter.started", {
      encounterId: saved.id,
      patientId: saved.patientId,
      chiefComplaint: saved.chiefComplaint,
      hospitalId,
      actorId,
    });
    return saved;
  }

  async listByPatient(patientId: string, hospitalId: string): Promise<Encounter[]> {
    return this.encounterRepo.find({
      where: { patientId, hospitalId },
      relations: ["vitalSigns", "soapNote"],
      order: { createdAt: "DESC" },
    });
  }

  async getEncounter(id: string, hospitalId: string, actorId: string): Promise<Encounter> {
    const encounter = await this.encounterRepo.findOne({
      where: { id, hospitalId },
      relations: ["vitalSigns", "soapNote"],
    });
    if (!encounter) throw new NotFoundException("Encounter not found");

    this.eventEmitter.emit("audit.log", {
      action: "READ_ENCOUNTER",
      resource: "Encounter",
      resourceId: encounter.id,
      actorId,
      details: { patientId: encounter.patientId },
    });

    return encounter;
  }

  async updateSoapNote(encounterId: string, hospitalId: string, dto: UpdateSoapNoteDto, actorId: string): Promise<SoapNote> {
    const encounter = await this.encounterRepo.findOne({
      where: { id: encounterId, hospitalId },
      relations: ["soapNote"],
    });
    if (!encounter) throw new NotFoundException("Encounter not found");

    if (encounter.soapNote) {
      Object.assign(encounter.soapNote, dto);
      return this.soapRepo.save(encounter.soapNote);
    } else {
      const newNote = this.soapRepo.create({ ...dto });
      encounter.soapNote = newNote;
      await this.encounterRepo.save(encounter);
      return newNote;
    }
  }

  async recordVitals(encounterId: string, hospitalId: string, dto: RecordVitalsDto, actorId: string): Promise<VitalSigns> {
    const encounter = await this.encounterRepo.findOne({
      where: { id: encounterId, hospitalId },
      relations: ["vitalSigns"],
    });
    if (!encounter) throw new NotFoundException("Encounter not found");

    if (encounter.vitalSigns) {
      Object.assign(encounter.vitalSigns, dto);
      return this.vitalsRepo.save(encounter.vitalSigns);
    } else {
      const newVitals = this.vitalsRepo.create({ ...dto });
      encounter.vitalSigns = newVitals;
      await this.encounterRepo.save(encounter);
      return newVitals;
    }
  }

  async signEncounter(id: string, hospitalId: string, actorId: string): Promise<Encounter> {
    const encounter = await this.encounterRepo.findOne({ where: { id, hospitalId } });
    if (!encounter) throw new NotFoundException("Encounter not found");
    encounter.status = EncounterStatus.SIGNED;
    encounter.updatedBy = actorId;
    const saved = await this.encounterRepo.save(encounter);
    
    this.eventEmitter.emit("clinical.encounter.signed", {
      encounterId: saved.id,
      patientId: saved.patientId,
      hospitalId,
      actorId,
    });
    
    return saved;
  }

  async searchKnowledgeBase(query: string): Promise<any> {
    if (!query || query.trim().length < 2) {
      return { diseases: [], symptoms: [], medications: [], procedures: [], guidelines: [] };
    }

    const cleanQuery = query.trim().toLowerCase();

    const matchingDiseases = await this.diseaseRepo
      .createQueryBuilder("d")
      .where("LOWER(d.name) LIKE :q", { q: `%${cleanQuery}%` })
      .orWhere("LOWER(d.description) LIKE :q", { q: `%${cleanQuery}%` })
      .orWhere("d.symptoms::text ILIKE :q", { q: `%${cleanQuery}%` })
      .orWhere("d.treatments::text ILIKE :q", { q: `%${cleanQuery}%` })
      .orWhere("d.investigations::text ILIKE :q", { q: `%${cleanQuery}%` })
      .getMany();

    const symptomsSet = new Set<string>();
    const medicationsSet = new Set<string>();
    const investigationsSet = new Set<string>();

    matchingDiseases.forEach(d => {
      d.symptoms.forEach(s => {
        if (s.toLowerCase().includes(cleanQuery)) symptomsSet.add(s);
      });
      d.treatments.forEach(t => {
        if (t.toLowerCase().includes(cleanQuery)) medicationsSet.add(t);
      });
      d.investigations.forEach(i => {
        if (i.toLowerCase().includes(cleanQuery)) investigationsSet.add(i);
      });
    });

    return {
      diseases: matchingDiseases,
      symptoms: Array.from(symptomsSet),
      medications: Array.from(medicationsSet),
      procedures: Array.from(investigationsSet),
      guidelines: matchingDiseases.map(d => ({
        disease: d.name,
        icd10Code: d.icd10Code,
        redFlags: d.redFlags,
        differentials: d.differentials,
      }))
    };
  }

  async symptomSearch(hospitalId: string, query: string): Promise<any> {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.trim().toLowerCase();

    const encounters = await this.encounterRepo
      .createQueryBuilder("e")
      .leftJoinAndSelect("e.patient", "p")
      .leftJoinAndSelect("e.soapNote", "s")
      .leftJoinAndSelect("e.vitalSigns", "v")
      .where("e.hospitalId = :hospitalId", { hospitalId })
      .andWhere(
        "(LOWER(e.chiefComplaint) LIKE :q OR LOWER(s.subjective) LIKE :q OR LOWER(s.assessment) LIKE :q OR LOWER(s.plan) LIKE :q)",
        { q: `%${cleanQuery}%` }
      )
      .orderBy("e.createdAt", "DESC")
      .getMany();

    return encounters;
  }
}

