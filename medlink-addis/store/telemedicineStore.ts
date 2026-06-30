import { create } from 'zustand';
import api from '@/lib/api';

export interface TelemedicineChatMessage {
  id: string;
  senderType: 'doctor' | 'patient';
  text: string;
  createdAt: string;
}

export interface TelemedicineSession {
  id: string;
  patientId: string;
  doctorId: string;
  status: string;
  roomUrl: string | null;
  startedAt: string | null;
  endedAt: string | null;
  patient: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    bloodType: string;
  };
}

interface TelemedicineState {
  session: TelemedicineSession | null;
  chatMessages: TelemedicineChatMessage[];
  loading: boolean;
  error: string | null;
  fetchActiveSession: () => Promise<void>;
  fetchChatMessages: (sessionId: string) => Promise<void>;
  sendChatMessage: (sessionId: string, senderType: 'doctor' | 'patient', text: string) => Promise<void>;
  submitPrescription: (
    sessionId: string,
    patientId: string,
    drugName: string,
    sig: string,
    qty: number,
    prescriberName: string
  ) => Promise<{ success: boolean; rxNumber: string }>;
}

export const useTelemedicineStore = create<TelemedicineState>((set, get) => ({
  session: null,
  chatMessages: [],
  loading: false,
  error: null,
  fetchActiveSession: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/telemedicine/sessions/active');
      const session = response.data.data;
      set({ session, loading: false });
      if (session) {
        get().fetchChatMessages(session.id);
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  fetchChatMessages: async (sessionId) => {
    try {
      const response = await api.get(`/telemedicine/sessions/${sessionId}/chat`);
      set({ chatMessages: response.data.data });
    } catch (err: any) {
      console.error('Failed to fetch chat messages', err);
    }
  },
  sendChatMessage: async (sessionId, senderType, text) => {
    try {
      const response = await api.post(`/telemedicine/sessions/${sessionId}/chat`, { senderType, text });
      set((state) => ({
        chatMessages: [...state.chatMessages, response.data.data],
      }));
    } catch (err: any) {
      console.error('Failed to send chat message', err);
    }
  },
  submitPrescription: async (sessionId, patientId, drugName, sig, qty, prescriberName) => {
    try {
      const response = await api.post(`/telemedicine/sessions/${sessionId}/prescription`, {
        patientId,
        drugName,
        sig,
        qty,
        prescriberName,
      });
      return response.data.data;
    } catch (err: any) {
      console.error('Failed to submit prescription', err);
      throw err;
    }
  },
}));
