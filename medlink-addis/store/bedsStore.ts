import { create } from "zustand";
import api from "@/lib/api";

export interface Bed {
  id: string;
  roomNumber: string;
  bedNumber: string;
  status: string; // Clean, Occupied, Reserved, Dirty, Maintenance
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  color: string;
  beds: Bed[];
}

export interface BedAdmission {
  id: string;
  patientId: string;
  bedId: string;
  admittedAt: string;
  dischargedAt: string | null;
  status: string;
  patient?: {
    firstName: string;
    lastName: string;
    mrn: string;
  };
  bed?: {
    roomNumber: string;
    bedNumber: string;
    ward?: {
      name: string;
    };
  };
}

interface BedsState {
  wards: Ward[];
  admissions: BedAdmission[];
  loading: boolean;
  error: string | null;
  fetchWards: () => Promise<void>;
  fetchAdmissions: () => Promise<void>;
  assignBed: (patientId: string, bedId: string) => Promise<boolean>;
  releaseBed: (admissionId: string) => Promise<boolean>;
}

export const useBedsStore = create<BedsState>((set, get) => ({
  wards: [],
  admissions: [],
  loading: false,
  error: null,

  fetchWards: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/beds/wards");
      const payload = response.data.data ?? response.data;
      set({ wards: Array.isArray(payload) ? payload : [], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  fetchAdmissions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/beds/admissions");
      const payload = response.data.data ?? response.data;
      set({ admissions: Array.isArray(payload) ? payload : [], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  assignBed: async (patientId, bedId) => {
    set({ loading: true, error: null });
    try {
      await api.post("/beds/assign", { patientId, bedId });
      set({ loading: false });
      await get().fetchWards();
      await get().fetchAdmissions();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },

  releaseBed: async (admissionId) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/beds/admissions/${admissionId}/release`);
      set({ loading: false });
      await get().fetchWards();
      await get().fetchAdmissions();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
}));
