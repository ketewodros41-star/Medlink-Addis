import { create } from "zustand";
import api from "@/lib/api";

export interface QueueEntry {
  id: string;
  patientId: string;
  queueNumber: string;
  currentDept: string;
  status: string;
  estimatedWaitMins: number;
  calledAt: string | null;
  createdAt: string;
  patient?: {
    firstName: string;
    lastName: string;
    mrn: string;
  };
}

interface PatientQueueState {
  queue: QueueEntry[];
  loading: boolean;
  error: string | null;
  fetchQueue: (dept?: string) => Promise<void>;
  joinQueue: (patientId: string, currentDept: string) => Promise<boolean>;
  updateQueueStatus: (id: string, status: string, currentDept?: string) => Promise<boolean>;
}

export const usePatientQueueStore = create<PatientQueueState>((set, get) => ({
  queue: [],
  loading: false,
  error: null,

  fetchQueue: async (dept) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/patient-queue", {
        params: dept ? { currentDept: dept } : {},
      });
      set({ queue: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  joinQueue: async (patientId, currentDept) => {
    set({ loading: true, error: null });
    try {
      await api.post("/patient-queue", { patientId, currentDept });
      set({ loading: false });
      await get().fetchQueue(currentDept);
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },

  updateQueueStatus: async (id, status, currentDept) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/patient-queue/${id}/status`, { status, currentDept });
      set({ loading: false });
      await get().fetchQueue(currentDept);
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
}));
