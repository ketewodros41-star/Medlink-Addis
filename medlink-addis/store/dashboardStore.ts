import { create } from "zustand";
import api from "@/lib/api";

interface DashboardMetrics {
  appointmentsCount: number;
  waitingCount: number;
  checkedInCount: number;
  activeEncountersCount: number;
  erQueueCount: number;
  labOrdersCount: number;
  criticalLabResultsCount: number;
  pendingRxCount: number;
  pendingBillingCount: number;
  revenueToday: number;
  bedOccupancy: number;
  occupiedBedsCount: number;
  totalBedsCount: number;
  lowStockMedicinesCount: number;
  activeDoctorsCount: number;
  averageWaitTime: number;
  averageConsultationTime: number;
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  fetchMetrics: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  loading: false,
  error: null,
  fetchMetrics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/dashboard/metrics");
      set({ metrics: response.data.data ?? response.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },
}));
