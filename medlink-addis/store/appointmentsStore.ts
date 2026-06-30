import { create } from 'zustand';
import api from '@/lib/api';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledTime: string;
  durationMinutes: number;
  status: string;
  type: string;
}

interface AppointmentsState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  fetchAppointments: () => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
  createAppointment: (data: {
    patientId: string;
    doctorId: string;
    scheduledTime: string;
    durationMinutes: number;
    type: string;
    notes?: string;
  }) => Promise<boolean>;
}

export const useAppointmentsStore = create<AppointmentsState>((set, get) => ({
  appointments: [],
  loading: false,
  error: null,
  fetchAppointments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/appointments');
      set({ appointments: response.data.data?.items || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  updateStatus: async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      // Refresh list
      get().fetchAppointments();
    } catch (err: any) {
      console.error('Failed to update status', err);
    }
  },
  createAppointment: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.post('/appointments', data);
      set({ loading: false });
      await get().fetchAppointments();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  }
}));
