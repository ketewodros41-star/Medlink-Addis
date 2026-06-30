import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getMetrics(hospitalId: string): Promise<any> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Appointments Today
    const [{ appointmentsCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "appointmentsCount" FROM appointments 
       WHERE hospital_id = $1 AND scheduled_time BETWEEN $2 AND $3`,
      [hospitalId, todayStart, todayEnd]
    );

    // 2. Queue metrics (Waiting/Checked In)
    const [{ waitingCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "waitingCount" FROM queue_entries 
       WHERE hospital_id = $1 AND status = 'Waiting'`,
      [hospitalId]
    );

    const [{ checkedInCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "checkedInCount" FROM queue_entries 
       WHERE hospital_id = $1 AND status IN ('Called', 'Processing')`,
      [hospitalId]
    );

    // 3. Active Encounters
    const [{ activeEncountersCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "activeEncountersCount" FROM encounters 
       WHERE hospital_id = $1 AND status = 'In Progress'`,
      [hospitalId]
    );

    // 4. Emergency Queue size
    const [{ erQueueCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "erQueueCount" FROM triage_entries 
       WHERE hospital_id = $1 AND status NOT IN ('Discharged', 'Admitted')`,
      [hospitalId]
    );

    // 5. Active Lab Orders count
    const [{ labOrdersCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "labOrdersCount" FROM lab_orders 
       WHERE hospital_id = $1 AND status != 'Resulted'`,
      [hospitalId]
    );

    // 6. Critical lab results
    const [{ criticalLabResultsCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "criticalLabResultsCount" FROM lab_orders 
       WHERE hospital_id = $1 AND status = 'Critical'`,
      [hospitalId]
    );

    // 7. Pending prescriptions
    const [{ pendingRxCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "pendingRxCount" FROM prescriptions 
       WHERE hospital_id = $1 AND status = 'Pending'`,
      [hospitalId]
    );

    // 8. Unpaid billing invoice count
    const [{ pendingBillingCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "pendingBillingCount" FROM invoices 
       WHERE hospital_id = $1 AND status != 'Paid'`,
      [hospitalId]
    );

    // 9. Revenue Today
    const [{ revenueToday }] = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0)::float as "revenueToday" FROM payments 
       WHERE hospital_id = $1 AND created_at BETWEEN $2 AND $3`,
      [hospitalId, todayStart, todayEnd]
    );

    // 10. Bed Occupancy (Occupied beds count / Total beds count)
    const [{ occupiedBedsCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "occupiedBedsCount" FROM beds 
       WHERE hospital_id = $1 AND status = 'Occupied'`,
      [hospitalId]
    );

    const [{ totalBedsCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "totalBedsCount" FROM beds 
       WHERE hospital_id = $1`,
      [hospitalId]
    );

    // 11. Low stock medicines
    const [{ lowStockMedicinesCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "lowStockMedicinesCount" FROM inventory_items 
       WHERE hospital_id = $1 AND stock <= "reorderLevel"`,
      [hospitalId]
    );

    // 12. Active Doctors working (mocked from users roles count)
    const [{ activeDoctorsCount }] = await this.dataSource.query(
      `SELECT COUNT(*)::int as "activeDoctorsCount" FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE u.hospital_id = $1 AND r.name ILIKE '%doctor%' AND u.is_active = true`,
      [hospitalId]
    );

    return {
      appointmentsCount,
      waitingCount,
      checkedInCount,
      activeEncountersCount,
      erQueueCount,
      labOrdersCount,
      criticalLabResultsCount,
      pendingRxCount,
      pendingBillingCount,
      revenueToday,
      bedOccupancy: totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0,
      occupiedBedsCount,
      totalBedsCount,
      lowStockMedicinesCount,
      activeDoctorsCount,
      averageWaitTime: 18, // Mocked in mins
      averageConsultationTime: 22, // Mocked in mins
    };
  }
}
