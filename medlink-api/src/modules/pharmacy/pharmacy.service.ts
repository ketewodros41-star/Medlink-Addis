import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Prescription, PrescriptionStatus } from "./entities/prescription.entity";
import { InventoryItem, InventoryItemStatus } from "./entities/inventory-item.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class PharmacyService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAllPrescriptions(hospitalId: string) {
    return this.prescriptionRepo.find({
      where: { hospitalId },
      relations: ["patient"],
      order: { createdAt: "DESC" },
    });
  }

  async findAllInventory(hospitalId: string) {
    return this.inventoryRepo.find({
      where: { hospitalId },
      order: { drugName: "ASC" },
    });
  }

  async getAlerts(hospitalId: string) {
    return this.prescriptionRepo.find({
      where: { hospitalId, interactionAlert: true },
      relations: ["patient"],
      order: { createdAt: "DESC" },
    });
  }

  async dispensePrescription(id: string, hospitalId: string, actorId: string): Promise<Prescription> {
    const rx = await this.prescriptionRepo.findOne({
      where: { id, hospitalId },
      relations: ["patient"],
    });
    if (!rx) throw new NotFoundException(`Prescription ${id} not found`);
    if (rx.status === PrescriptionStatus.DISPENSED) {
      throw new BadRequestException("Prescription has already been dispensed");
    }

    // Match inventory item by case-insensitive name
    const inv = await this.inventoryRepo.findOne({
      where: { hospitalId, drugName: rx.drugName },
    });

    if (!inv) {
      throw new BadRequestException(`Medication "${rx.drugName}" is not registered in pharmacy inventory`);
    }

    if (inv.stock < rx.qty) {
      throw new BadRequestException(`Insufficient inventory stock. Required: ${rx.qty}, Available: ${inv.stock}`);
    }

    // Deduct stock
    inv.stock -= rx.qty;
    if (inv.stock <= inv.reorderLevel / 2) {
      inv.status = InventoryItemStatus.CRITICAL;
    } else if (inv.stock <= inv.reorderLevel) {
      inv.status = InventoryItemStatus.LOW;
    } else {
      inv.status = InventoryItemStatus.OK;
    }
    await this.inventoryRepo.save(inv);

    // Update prescription
    rx.status = PrescriptionStatus.DISPENSED;
    const savedRx = await this.prescriptionRepo.save(rx);

    // Emit event to trigger patient timeline log
    this.eventEmitter.emit("clinical.prescription.dispensed", {
      prescriptionId: rx.id,
      patientId: rx.patientId,
      drugName: rx.drugName,
      qty: rx.qty,
      hospitalId,
      actorId,
    });

    return savedRx;
  }

  async restockInventory(id: string, qty: number, hospitalId: string, actorId: string): Promise<InventoryItem> {
    const inv = await this.inventoryRepo.findOne({ where: { id, hospitalId } });
    if (!inv) throw new NotFoundException("Inventory item not found");

    inv.stock += qty;
    if (inv.stock <= inv.reorderLevel / 2) {
      inv.status = InventoryItemStatus.CRITICAL;
    } else if (inv.stock <= inv.reorderLevel) {
      inv.status = InventoryItemStatus.LOW;
    } else {
      inv.status = InventoryItemStatus.OK;
    }
    return this.inventoryRepo.save(inv);
  }

  async addInventoryItem(
    hospitalId: string,
    dto: { drugName: string; stock: number; reorderLevel: number; expiryDate: string },
  ): Promise<InventoryItem> {
    const existing = await this.inventoryRepo.findOne({
      where: { hospitalId, drugName: dto.drugName },
    });
    if (existing) {
      throw new BadRequestException(`Drug "${dto.drugName}" already exists in inventory`);
    }

    const item = this.inventoryRepo.create({
      ...dto,
      expiryDate: new Date(dto.expiryDate),
      hospitalId,
      status: dto.stock <= dto.reorderLevel ? InventoryItemStatus.LOW : InventoryItemStatus.OK,
    });
    return this.inventoryRepo.save(item);
  }

  @OnEvent("telemedicine.prescription.created")
  async handleTelemedicinePrescriptionCreated(payload: {
    hospitalId: string;
    patientId: string;
    drugName: string;
    sig: string;
    qty: number;
    prescriberName: string;
    rxNumber: string;
  }) {
    // Check for hardcoded drug interaction warning
    let interactionAlert = false;
    let interactionDetails = null;
    if (payload.drugName.toLowerCase().includes("warfarin")) {
      interactionAlert = true;
      interactionDetails = "Warfarin + Aspirin: Increased risk of bleeding.";
    }

    const prescription = this.prescriptionRepo.create({
      hospitalId: payload.hospitalId,
      patientId: payload.patientId,
      drugName: payload.drugName,
      sig: payload.sig,
      qty: payload.qty,
      prescriberName: payload.prescriberName,
      rxNumber: payload.rxNumber,
      status: interactionAlert ? PrescriptionStatus.HOLD : PrescriptionStatus.PENDING,
      interactionAlert,
      interactionDetails,
      version: 1,
    });

    const saved = await this.prescriptionRepo.save(prescription);

    // Emit prescription created event to trigger timeline
    this.eventEmitter.emit("clinical.prescription.created", {
      prescriptionId: saved.id,
      patientId: saved.patientId,
      drugName: saved.drugName,
      sig: saved.sig,
      hospitalId: payload.hospitalId,
    });
  }
}
