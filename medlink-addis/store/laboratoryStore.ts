import { create } from "zustand";
import api from "@/lib/api";

export interface LabOrder {
  id: string;
  patientId: string;
  doctorId: string;
  encounterId: string | null;
  testName: string;
  status: "Pending" | "Collected" | "Processing" | "Resulted" | "Critical";
  result: string | null;
  criticalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
  };
}

interface LaboratoryState {
  orders: LabOrder[];
  loading: boolean;
  error: string | null;
  fetchOrders: (patientId?: string, status?: string) => Promise<void>;
  createOrder: (data: { patientId: string; testName: string; encounterId?: string }) => Promise<boolean>;
  updateResult: (id: string, data: { result?: string; status?: string; criticalNotes?: string }) => Promise<boolean>;
}

export const useLaboratoryStore = create<LaboratoryState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async (patientId, status) => {
    set({ loading: true, error: null });
    try {
      const params: Record<string, any> = {};
      if (patientId) params.patientId = patientId;
      if (status) params.status = status;

      const response = await api.get("/laboratory/orders", { params });
      set({ orders: response.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  createOrder: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.post("/laboratory/orders", data);
      set({ loading: false });
      await get().fetchOrders();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },

  updateResult: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/laboratory/orders/${id}/result`, data);
      set({ loading: false });
      await get().fetchOrders();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
}));
