import { create } from "zustand";
import api from "@/lib/api";

interface AiState {
  loading: boolean;
  error: string | null;
  generateSoap: (complaint: string, transcript: string) => Promise<any>;
  explainPrescription: (drugName: string, sig: string) => Promise<any>;
  interpretLabResult: (testName: string, result: string) => Promise<any>;
  checkInteraction: (drugs: string[]) => Promise<any>;
}

export const useAiStore = create<AiState>((set) => ({
  loading: false,
  error: null,

  generateSoap: async (complaint, transcript) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/ai/scribe", { complaint, transcript });
      set({ loading: false });
      return response.data;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return null;
    }
  },

  explainPrescription: async (drugName, sig) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/ai/explain-rx", { drugName, sig });
      set({ loading: false });
      return response.data;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return null;
    }
  },

  interpretLabResult: async (testName, result) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/ai/interpret-lab", { testName, result });
      set({ loading: false });
      return response.data;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return null;
    }
  },

  checkInteraction: async (drugs) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/ai/drug-interaction", { drugs });
      set({ loading: false });
      return response.data;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return null;
    }
  },
}));
