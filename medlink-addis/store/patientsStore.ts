import { create } from 'zustand';
import api from '@/lib/api';

export interface PatientAllergy {
  substance: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  reaction?: string;
}

export interface PatientFlag {
  type: string;
  priority: 'low' | 'medium' | 'high';
  note?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodType: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  nationalId: string | null;
  allergies: PatientAllergy[];
  medicalFlags: PatientFlag[];
  createdAt: string;
  updatedAt: string;
}

export interface Encounter {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string | null;
  chiefComplaint: string | null;
  status: string;
  vitalSigns: {
    bpSystolic?: number;
    bpDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    spo2?: number;
    respiratoryRate?: number;
  } | null;
  soapNote: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface PatientsState {
  patients: Patient[];
  selectedPatient: Patient | null;
  encounters: Encounter[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  total: number;
  fetchPatients: (q?: string, page?: number) => Promise<void>;
  fetchPatient: (id: string) => Promise<void>;
  createPatient: (data: Partial<Patient>) => Promise<Patient | null>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  fetchEncounters: (patientId: string) => Promise<void>;
  createEncounter: (patientId: string, chiefComplaint: string) => Promise<Encounter | null>;
  setSearchQuery: (q: string) => void;
}

export const usePatientsStore = create<PatientsState>((set, get) => ({
  patients: [],
  selectedPatient: null,
  encounters: [],
  loading: false,
  error: null,
  searchQuery: '',
  currentPage: 1,
  totalPages: 1,
  total: 0,

  setSearchQuery: (q) => set({ searchQuery: q }),

  fetchPatients: async (q?: string, page = 1) => {
    set({ loading: true, error: null });
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (q) params.q = q;
      const response = await api.get('/patients', { params });
      const payload = response.data.data ?? response.data;
      set({
        patients: payload.data ?? [],
        currentPage: payload.meta?.page ?? 1,
        totalPages: payload.meta?.totalPages ?? 1,
        total: payload.meta?.total ?? 0,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchPatient: async (id: string) => {
    set({ loading: true, error: null, selectedPatient: null });
    try {
      const response = await api.get(`/patients/${id}`);
      set({ selectedPatient: response.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createPatient: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/patients', data);
      const created: Patient = response.data.data;
      set((state) => ({ patients: [created, ...state.patients], loading: false }));
      return created;
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || err.message, loading: false });
      return null;
    }
  },

  updatePatient: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/patients/${id}`, data);
      const updated: Patient = response.data.data;
      set((state) => ({
        patients: state.patients.map((p) => (p.id === id ? updated : p)),
        selectedPatient: updated,
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchEncounters: async (patientId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/clinical/encounters/patient/${patientId}`);
      set({ encounters: response.data.data ?? [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createEncounter: async (patientId: string, chiefComplaint: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/clinical/encounters', { patientId, chiefComplaint });
      const enc: Encounter = response.data.data;
      set((state) => ({ encounters: [enc, ...state.encounters], loading: false }));
      return enc;
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || err.message, loading: false });
      return null;
    }
  },
}));
