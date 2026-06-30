import { create } from 'zustand';
import api from '@/lib/api';

export interface Disease {
  id: string;
  name: string;
  icd10Code: string;
  description: string;
  symptoms: string[];
  signs: string[];
  investigations: string[];
  treatments: string[];
  redFlags: string[];
  differentials: string[];
  evidenceLevel: string;
  lastReviewed: string;
}

export interface CaseStudy {
  id: string;
  chiefComplaint: string | null;
  status: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    mrn: string;
  };
  soapNote: {
    id: string;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  } | null;
  vitalSigns: {
    bpSystolic?: number;
    bpDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    spo2?: number;
    respiratoryRate?: number;
  } | null;
}

interface SymptomSearchState {
  knowledgeBase: {
    diseases: Disease[];
    symptoms: string[];
    medications: string[];
    procedures: string[];
    guidelines: Array<{ disease: string; icd10Code: string; redFlags: string[]; differentials: string[] }>;
  };
  caseExplorer: CaseStudy[];
  loading: boolean;
  error: string | null;
  searchSymptomData: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSymptomSearchStore = create<SymptomSearchState>((set) => ({
  knowledgeBase: {
    diseases: [],
    symptoms: [],
    medications: [],
    procedures: [],
    guidelines: [],
  },
  caseExplorer: [],
  loading: false,
  error: null,

  searchSymptomData: async (query: string) => {
    if (!query || query.trim().length < 2) {
      set({
        knowledgeBase: { diseases: [], symptoms: [], medications: [], procedures: [], guidelines: [] },
        caseExplorer: [],
      });
      return;
    }
    set({ loading: true, error: null });
    try {
      const [refRes, caseRes] = await Promise.all([
        api.get(`/clinical/reference-search?query=${encodeURIComponent(query)}`),
        api.get(`/clinical/symptom-search?query=${encodeURIComponent(query)}`),
      ]);

      set({
        knowledgeBase: refRes.data,
        caseExplorer: caseRes.data,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  clearSearch: () => {
    set({
      knowledgeBase: { diseases: [], symptoms: [], medications: [], procedures: [], guidelines: [] },
      caseExplorer: [],
      error: null,
    });
  }
}));
