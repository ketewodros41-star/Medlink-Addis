export type KnowledgeSearchResult = {
  domain: "disease" | "symptom" | "medication" | "lab" | "imaging" | "procedure" | "guideline";
  id: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  tags: string[];
  score?: number;
};
