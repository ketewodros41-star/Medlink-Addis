import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OnEvent } from "@nestjs/event-emitter";
import { PatientTimeline } from "./entities/timeline.entity";

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(
    @InjectRepository(PatientTimeline)
    private readonly timelineRepo: Repository<PatientTimeline>,
  ) {}

  async logEvent(
    hospitalId: string,
    patientId: string,
    eventType: string,
    title: string,
    description?: string,
    metadata?: Record<string, any>,
    actorId?: string,
  ) {
    try {
      const event = this.timelineRepo.create({
        hospitalId,
        patientId,
        eventType,
        title,
        description,
        metadata,
        createdBy: actorId,
        updatedBy: actorId,
      });
      await this.timelineRepo.save(event);
    } catch (err) {
      this.logger.error(`Failed to log timeline event ${eventType} for patient ${patientId}`, err);
    }
  }

  async getTimeline(hospitalId: string, patientId: string): Promise<PatientTimeline[]> {
    return this.timelineRepo.find({
      where: { hospitalId, patientId },
      order: { createdAt: "DESC" },
    });
  }

  // ---- Event Handlers ----

  @OnEvent("appointment.scheduled")
  async handleApptScheduled(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "appointment booked",
      "Appointment Booked",
      `Scheduled for ${new Date(payload.scheduledTime).toLocaleString()}`,
      { appointmentId: payload.appointmentId },
      payload.actorId,
    );
  }

  @OnEvent("appointment.arrived")
  async handleApptArrived(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "patient checked in",
      "Patient Checked In",
      "Arrived at the reception queue.",
      { appointmentId: payload.appointmentId },
      payload.actorId,
    );
  }

  @OnEvent("clinical.encounter.started")
  async handleEncounterStarted(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "encounter started",
      "Encounter Started",
      `Chief Complaint: ${payload.chiefComplaint || "None"}`,
      { encounterId: payload.encounterId },
      payload.actorId,
    );
  }

  @OnEvent("clinical.encounter.signed")
  async handleEncounterSigned(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "encounter signed",
      "Encounter Signed",
      "Clinical notes finalized and locked.",
      { encounterId: payload.encounterId },
      payload.actorId,
    );
  }

  @OnEvent("clinical.lab.ordered")
  async handleLabOrdered(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "lab ordered",
      "Laboratory Ordered",
      `Test ordered: ${payload.testName}`,
      { orderId: payload.orderId },
      payload.actorId,
    );
  }

  @OnEvent("clinical.lab.resulted")
  async handleLabResulted(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "lab completed",
      "Laboratory Completed",
      `Result: ${payload.result}`,
      { orderId: payload.orderId },
      payload.actorId,
    );
  }

  @OnEvent("clinical.lab.critical")
  async handleLabCritical(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "lab completed",
      "🚨 Critical Laboratory Alert",
      `Critical findings for ${payload.testName}: ${payload.result}`,
      { orderId: payload.orderId, critical: true },
      payload.actorId,
    );
  }

  @OnEvent("clinical.prescription.created")
  async handlePrescriptionCreated(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "prescription created",
      "Prescription Issued",
      `Medication: ${payload.drugName} - Sig: ${payload.sig}`,
      { prescriptionId: payload.prescriptionId },
      payload.actorId,
    );
  }

  @OnEvent("clinical.prescription.dispensed")
  async handlePrescriptionDispensed(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "medication dispensed",
      "Medication Dispensed",
      `Dispensed: ${payload.drugName} (Qty: ${payload.qty})`,
      { prescriptionId: payload.prescriptionId },
      payload.actorId,
    );
  }

  @OnEvent("billing.invoice.generated")
  async handleInvoiceGenerated(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "invoice generated",
      "Billing Invoice Generated",
      `Invoice #: ${payload.invoiceNumber} - Amount: ETB ${payload.totalAmount}`,
      { invoiceId: payload.invoiceId },
      payload.actorId,
    );
  }

  @OnEvent("billing.payment.completed")
  async handlePaymentCompleted(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "payment completed",
      "Payment Completed",
      `Paid: ETB ${payload.amountPaid} via ${payload.paymentMethod}`,
      { paymentId: payload.paymentId, invoiceId: payload.invoiceId },
      payload.actorId,
    );
  }

  @OnEvent("emergency.triage.created")
  async handleTriageCreated(payload: any) {
    if (!payload.patientId) return;
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "patient admitted",
      "Admitted to Triage",
      `Complaint: ${payload.complaint} - Priority: P${payload.priority}`,
      { triageId: payload.triageId },
      payload.actorId,
    );
  }

  @OnEvent("ward.bed.assigned")
  async handleBedAssigned(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "ward transferred",
      "Bed Assigned",
      `Ward: ${payload.wardName} - Room: ${payload.roomNumber} - Bed: ${payload.bedNumber}`,
      { bedId: payload.bedId, admissionId: payload.admissionId },
      payload.actorId,
    );
  }

  @OnEvent("ward.bed.released")
  async handleBedReleased(payload: any) {
    await this.logEvent(
      payload.hospitalId,
      payload.patientId,
      "discharge completed",
      "Bed Released / Discharged",
      "Patient discharged from ward bed.",
      { bedId: payload.bedId, admissionId: payload.admissionId },
      payload.actorId,
    );
  }
}
