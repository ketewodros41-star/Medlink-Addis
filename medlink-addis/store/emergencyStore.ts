import { create } from "zustand";
import api from "@/lib/api";

export interface TriageEntry {
  id: string;
  patientId: string | null;
  patientName: string;
  age: number;
  gender: string;
  complaint: string;
  priority: number;
  priorityLabel: string;
  status: "Waiting" | "Assessment" | "Treatment" | "Resuscitation" | "Discharged" | "Admitted";
  color: string;
  arrivedAt: string;
  patient?: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
  };
}

interface EmergencyState {
  triageQueue: TriageEntry[];
  loading: boolean;
  error: string | null;
  fetchQueue: () => Promise<void>;
  createTriageEntry: (data: {
    patientId?: string;
    patientName: string;
    age: number;
    gender: string;
    complaint: string;
    priority: number;
  }) => Promise<boolean>;
  updateTriageStatus: (id: string, data: { status?: string; priority?: number }) => Promise<boolean>;
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  triageQueue: [],
  loading: false,
  error: null,

  fetchQueue: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/emergency/triage");
      set({ triageQueue: response.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  createTriageEntry: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.post("/emergency/triage", data);
      set({ loading: false });
      await get().fetchQueue();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },

  updateTriageStatus: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/emergency/triage/${id}/status`, data);
      set({ loading: false });
      await get().fetchQueue();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
}));
