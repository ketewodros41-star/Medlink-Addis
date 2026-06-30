"use client";
import { create } from "zustand";
import api from "@/lib/api";

export type KnowledgeDomain =
  | "all"
  | "diseases"
  | "symptoms"
  | "medications"
  | "labs"
  | "imaging"
  | "procedures"
  | "guidelines";

export type KnowledgeSearchResult = {
  domain: "disease" | "symptom" | "medication" | "lab" | "imaging" | "procedure" | "guideline";
  id: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  tags: string[];
  score?: number;
};

export type CalculatorDefinition = {
  id: string;
  name: string;
  specialty: string;
  description: string;
  inputs: Array<{
    key: string;
    label: string;
    type: "boolean" | "number" | "select";
    options?: Array<{ label: string; value: string | number }>;
  }>;
  references: string[];
};

type ClinicalKnowledgeState = {
  query: string;
  domain: KnowledgeDomain;
  specialty: string;
  results: KnowledgeSearchResult[];
  selected: any | null;
  calculators: CalculatorDefinition[];
  specialties: string[];
  loading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  setDomain: (domain: KnowledgeDomain) => void;
  setSpecialty: (specialty: string) => void;
  bootstrap: () => Promise<void>;
  search: () => Promise<void>;
  loadDetail: (domain: string, id: string) => Promise<void>;
  calculate: (id: string, inputs: Record<string, number | boolean | string>) => Promise<any>;
};

export const useClinicalKnowledgeStore = create<ClinicalKnowledgeState>((set, get) => ({
  query: "",
  domain: "all",
  specialty: "",
  results: [],
  selected: null,
  calculators: [],
  specialties: [],
  loading: false,
  error: null,

  setQuery: (query) => set({ query }),
  setDomain: (domain) => set({ domain }),
  setSpecialty: (specialty) => set({ specialty }),

  bootstrap: async () => {
    const [specialties, calculators] = await Promise.all([
      api.get("/clinical-knowledge/specialties"),
      api.get("/clinical-knowledge/calculators"),
    ]);
    set({
      specialties: specialties.data.data ?? specialties.data,
      calculators: calculators.data.data ?? calculators.data,
    });
  },

  search: async () => {
    const { query, domain, specialty } = get();
    if (query.trim().length < 2) {
      set({ results: [], selected: null, error: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      const response = await api.get("/clinical-knowledge/search", {
        params: { q: query.trim(), domain, specialty: specialty || undefined, limit: 30 },
      });
      const payload = response.data.data ?? response.data;
      set({ results: payload.items ?? [], selected: null });
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message ?? error.message });
    } finally {
      set({ loading: false });
    }
  },

  loadDetail: async (domain, id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/clinical-knowledge/detail/${domain}/${id}`);
      set({ selected: response.data.data ?? response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message ?? error.message });
    } finally {
      set({ loading: false });
    }
  },

  calculate: async (id, inputs) => {
    const response = await api.post(`/clinical-knowledge/calculators/${id}/calculate`, { inputs });
    return response.data.data ?? response.data;
  },
}));
