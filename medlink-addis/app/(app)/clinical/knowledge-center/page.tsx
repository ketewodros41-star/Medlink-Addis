"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, BookOpen, Calculator, Database, FileSearch, FlaskConical,
  Loader2, Pill, Search, ShieldCheck, Stethoscope, ChevronRight, Copy, Check, Info, FileText, Activity, ShieldAlert
} from "lucide-react";
import Topbar from "@/components/Topbar";
import api from "@/lib/api";
import { useClinicalKnowledgeStore, KnowledgeDomain, CalculatorDefinition } from "@/store/clinicalKnowledgeStore";
import { useAuthStore } from "@/store/authStore";

const domains: Array<{ id: KnowledgeDomain; label: string }> = [
  { id: "all", label: "All" },
  { id: "diseases", label: "Diseases" },
  { id: "medications", label: "Drugs" },
  { id: "labs", label: "Labs" },
  { id: "imaging", label: "Imaging" },
  { id: "procedures", label: "Procedures" },
  { id: "guidelines", label: "Guidelines" },
];

const iconFor = (domain: string) => {
  if (domain === "medication") return Pill;
  if (domain === "lab") return FlaskConical;
  if (domain === "guideline") return ShieldCheck;
  if (domain === "procedure") return Stethoscope;
  return BookOpen;
};

export default function ClinicalKnowledgeCenterPage() {
  const { profile } = useAuthStore();
  const userRoles = profile?.roles?.map((r: any) => r.name) || [];
  const isAdminOrCmo = userRoles.includes("hospital_admin") || userRoles.includes("super_admin") || userRoles.includes("medical_director");
  const isCmo = userRoles.includes("medical_director");

  // CMO Guidelines Approvals State
  const [approvalsQueue, setApprovalsQueue] = useState([
    { id: "app-1", title: "CURB-65 Pneumonia Pathway Update v2.1", type: "Clinical Guideline", status: "pending_approval" },
    { id: "app-2", title: "Surgical Prophylaxis Guidelines 2026", type: "Treatment Protocol", status: "pending_approval" },
    { id: "app-3", title: "Artemether-Lumefantrine Pediatric Drug Protocol v1.4", type: "Drug Protocol", status: "pending_approval" }
  ]);

  const {
    query, domain, specialty, results, selected, calculators, specialties, loading, error,
    setQuery, setDomain, setSpecialty, bootstrap, search, loadDetail
  } = useClinicalKnowledgeStore();

  const [activeTab, setActiveTab] = useState<"reference" | "calculators" | "cases" | "governance" | "differential">("reference");

  // Local state for interactive cases matching search term
  const [relatedCases, setRelatedCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);

  // Differential Diagnosis Finder State
  const [symptomList, setSymptomList] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [differentials, setDifferentials] = useState<any[]>([]);
  const [diffLoading, setDiffLoading] = useState(false);


  // Administrative Import State
  const [importSourceType, setImportSourceType] = useState<"cdc-icd10-cm" | "rxnorm-prescribable" | "loinc" | "medlineplus">("cdc-icd10-cm");
  const [importVersion, setImportVersion] = useState("starter-2026.06");
  const [importSourceName, setImportSourceName] = useState("CDC ICD-10 Tabular List");
  const [importSourceUrl, setImportSourceUrl] = useState("https://www.cdc.gov/nchs/icd/icd10cm.htm");
  const [importPublishedDate, setImportPublishedDate] = useState("2026-01-01");
  const [importContent, setImportContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Version history mock data
  const [contentVersions, setContentVersions] = useState<any[]>([
    { id: "v1", dataset: "diseases", versionLabel: "starter-2026.06", sourceName: "CDC ICD-10 Tabular List", status: "published", importedAt: "2026-06-29T10:00:00Z" },
    { id: "v2", dataset: "medications", versionLabel: "starter-2026.06", sourceName: "NIH RxNorm", status: "published", importedAt: "2026-06-29T10:05:00Z" },
    { id: "v3", dataset: "labs", versionLabel: "starter-2026.06", sourceName: "LOINC", status: "published", importedAt: "2026-06-29T10:10:00Z" },
  ]);

  useEffect(() => {
    bootstrap().catch(() => {});
  }, [bootstrap]);

  useEffect(() => {
    const handle = setTimeout(() => {
      search();
      if (query.trim().length >= 2) {
        setCasesLoading(true);
        api.get(`/clinical-knowledge/assist?query=${encodeURIComponent(query.trim())}`)
          .then(res => {
            const payload = res.data.data ?? res.data;
            setRelatedCases(payload.cases ?? []);
          })
          .catch(() => {})
          .finally(() => setCasesLoading(false));
      } else {
        setRelatedCases([]);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query, domain, specialty, search]);

  const handleSpecialtyClick = (spec: string) => {
    setSpecialty(spec);
    setActiveTab("reference");
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importContent.trim()) {
      setImportError("Please provide import content.");
      return;
    }
    setImporting(true);
    setImportSummary(null);
    setImportError(null);
    try {
      const response = await api.post("/clinical-knowledge/imports/source-file", {
        sourceType: importSourceType,
        version: importVersion,
        sourceName: importSourceName,
        sourceUrl: importSourceUrl,
        publishedAt: importPublishedDate,
        content: importContent,
      });
      const summary = response.data.data ?? response.data;
      setImportSummary(summary);
      // Append to mocks
      setContentVersions(prev => [
        {
          id: String(Date.now()),
          dataset: summary.dataset,
          versionLabel: summary.version,
          sourceName: importSourceName,
          status: "published",
          importedAt: new Date().toISOString(),
        },
        ...prev
      ]);
      setImportContent("");
    } catch (err: any) {
      setImportError(err.response?.data?.message || err.message || "Failed to process source file import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Topbar title="Clinical Knowledge Center" />
      <main className="p-6 space-y-6">
        
        {/* Banner with general description */}
        <section className="glass-shell card glass p-6 space-y-4" style={{ borderRadius: 12 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#9fd8bd] text-xs font-semibold uppercase tracking-wide">
                <Database size={14} /> Shared Decision-Support Reference
              </div>
              <h1 className="text-[#eeeae0] text-xl font-bold mt-1">Clinical Knowledge Center</h1>
              <p className="text-[#93a096] text-xs mt-1 max-w-4xl">
                Provides clinicians with fast, local, offline access to standard medical reference monographs,
                common guidelines, laboratory specifications, drug monographs, and clinical scoring calculators.
              </p>
            </div>
            <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10" style={{ minWidth: "max-content" }}>
              {[
                { id: "reference", label: "Reference Center" },
                { id: "differential", label: "Differential Diagnosis Finder" },
                { id: "calculators", label: "Interactive Calculators" },
                { id: "cases", label: "Hospital Case Explorer" },
                isAdminOrCmo ? { id: "governance", label: isCmo ? "CMO Governance & Approvals" : "Governance & Imports" } : null,
              ].filter((x): x is { id: string; label: string } => !!x).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.id ? "bg-[#9fd8bd] text-[#121614] shadow" : "text-[#93a096] hover:text-[#eeeae0]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {activeTab === "reference" && (
          <section className="grid grid-cols-12 gap-6 items-start">
            
            {/* Left side: Specialty lists and Search filters */}
            <div className="col-span-4 space-y-4">
              <div className="glass-shell card glass space-y-3 p-4" style={{ borderRadius: 10 }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93a096]" size={15} />
                  <input
                    className="input pl-9"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search MI, Asthma, Lisinopril, Troponin..."
                  />
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {domains.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDomain(item.id)}
                      className={`px-2 py-0.5 rounded border text-[11px] transition-all ${
                        domain === item.id
                          ? "bg-[#9fd8bd]/15 border-[#9fd8bd]/30 text-[#9fd8bd]"
                          : "bg-white/5 border-white/5 text-[#93a096] hover:bg-white/10"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <select className="input" value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
                  <option value="">All Specialties</option>
                  {specialties.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              {/* Specialty Browse Grid if search query is empty */}
              {!query && (
                <div className="glass-shell card glass p-4 space-y-2.5" style={{ borderRadius: 10 }}>
                  <h3 className="text-[11px] text-[#93a096] uppercase font-bold tracking-wider">Browse by Specialty</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {specialties.map((spec) => (
                      <button
                        key={spec}
                        onClick={() => handleSpecialtyClick(spec)}
                        className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left text-xs font-semibold text-[#eeeae0]"
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results Listing */}
              {query && (
                <div className="glass-shell card glass p-0 overflow-hidden" style={{ borderRadius: 10 }}>
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#eeeae0] uppercase tracking-wider">Matches</span>
                    {loading && <Loader2 size={12} className="animate-spin text-[#9fd8bd]" />}
                  </div>
                  <div className="max-h-[460px] overflow-y-auto p-2 space-y-1.5">
                    {results.map((item) => {
                      const Icon = iconFor(item.domain);
                      return (
                        <button
                          key={`${item.domain}-${item.id}`}
                          onClick={() => loadDetail(item.domain, item.id)}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                            selected?.id === item.id
                              ? "bg-white/10 border-[#9fd8bd]/40"
                              : "bg-white/5 border-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Icon size={14} className="text-[#9fd8bd] mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#eeeae0] truncate">{item.title}</div>
                              <div className="text-[10px] text-[#93a096] mt-0.5 capitalize">
                                {item.domain} {item.subtitle ? `· ${item.subtitle}` : ""}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {!results.length && !loading && (
                      <div className="py-10 text-center text-xs text-[#93a096]">
                        <FileSearch size={22} className="mx-auto mb-2 opacity-40" />
                        No matching reference files found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Tailored Monograph Details Panel */}
            <div className="col-span-8">
              <TailoredDetailPanel selected={selected} error={error} />
            </div>
          </section>
        )}

        {activeTab === "differential" && (
          <section className="grid grid-cols-12 gap-6 items-start">
            {/* Symptoms Input Panel */}
            <div className="col-span-4 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 10 }}>
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Stethoscope size={16} className="text-[#9fd8bd]" />
                <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Enter Presenting Symptoms</h3>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] text-[#93a096]">Type symptoms below and press Enter to construct a clinical profile.</p>
                <div className="flex gap-2">
                  <input
                    className="input"
                    value={symptomInput}
                    onChange={e => setSymptomInput(e.target.value)}
                    placeholder="e.g. chest pain, fever, cough..."
                    onKeyDown={e => {
                      if (e.key === "Enter" && symptomInput.trim()) {
                        e.preventDefault();
                        if (!symptomList.includes(symptomInput.trim().toLowerCase())) {
                          setSymptomList(prev => [...prev, symptomInput.trim().toLowerCase()]);
                        }
                        setSymptomInput("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (symptomInput.trim()) {
                        if (!symptomList.includes(symptomInput.trim().toLowerCase())) {
                          setSymptomList(prev => [...prev, symptomInput.trim().toLowerCase()]);
                        }
                        setSymptomInput("");
                      }
                    }}
                    className="btn-primary px-3 text-xs"
                  >
                    Add
                  </button>
                </div>

                {/* Symptom badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {symptomList.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded bg-[#9fd8bd]/10 border border-[#9fd8bd]/25 text-xs text-[#9fd8bd] flex items-center gap-1.5">
                      {s}
                      <button
                        onClick={() => setSymptomList(prev => prev.filter(x => x !== s))}
                        className="hover:text-red-400 font-bold text-[10px]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {symptomList.length === 0 && (
                    <span className="text-[11px] text-[#93a096] italic">No symptoms added.</span>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setSymptomList([]); setDifferentials([]); }}
                    className="btn-secondary flex-1 text-xs py-2"
                  >
                    Reset Profile
                  </button>
                  <button
                    disabled={symptomList.length === 0 || diffLoading}
                    onClick={async () => {
                      setDiffLoading(true);
                      try {
                        const res = await api.post("/clinical-knowledge/differential", { symptoms: symptomList });
                        setDifferentials(res.data.diseases ?? res.data.data?.diseases ?? []);
                      } catch (err) {
                        console.error("Differential diagnosis lookups failed:", err);
                      } finally {
                        setDiffLoading(false);
                      }
                    }}
                    className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    {diffLoading ? <Loader2 size={12} className="animate-spin" /> : "Run Diagnosis"}
                  </button>
                </div>
              </div>
            </div>

            {/* Differential Results Panel */}
            <div className="col-span-8 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 10 }}>
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Ranked Differential Diagnoses</h3>
                <span className="text-[10px] text-[#93a096]">{differentials.length} matching diseases</span>
              </div>

              {diffLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#9fd8bd]" size={30} /></div>
              ) : differentials.length > 0 ? (
                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {differentials.map((item, idx) => (
                    <div key={item.disease.id} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#eeeae0]">{idx + 1}. {item.disease.name}</span>
                            <span className="text-[#9fd8bd] font-mono text-[10px]">{item.disease.icd10Code}</span>
                          </div>
                          <p className="text-[11px] text-[#93a096] mt-0.5 line-clamp-1">{item.disease.description}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                          item.score >= 0.7 ? "bg-emerald-500/10 text-[#9fd8bd] border border-emerald-500/25" : "bg-amber-500/10 text-[#fb923c] border border-amber-500/25"
                        }`}>
                          {Math.round(item.score * 100)}% Match
                        </span>
                      </div>

                      {/* Sympotms details */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[#93a096] text-[10px] uppercase font-semibold">Matched Symptoms ({item.matchedSymptoms.length})</span>
                          <div className="flex flex-wrap gap-1">
                            {item.matchedSymptoms.map((s: string) => (
                              <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/15 text-[10px] text-[#9fd8bd]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[#93a096] text-[10px] uppercase font-semibold">Missing Symptoms ({item.missingSymptoms.length})</span>
                          <div className="flex flex-wrap gap-1">
                            {item.missingSymptoms.map((s: string) => (
                              <span key={s} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-[#93a096]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            setActiveTab("reference");
                            setQuery(item.disease.name);
                            loadDetail("disease", item.disease.id);
                          }}
                          className="text-xs text-[#a3d1df] hover:underline flex items-center gap-1"
                        >
                          View Full Monograph <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-xs text-[#93a096]">
                  <FileSearch size={32} className="mx-auto mb-2 opacity-40" />
                  Configure symptoms list and click "Run Diagnosis" to explore differentials.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "calculators" && <CalculatorsDashboard calculators={calculators} />}

        {activeTab === "cases" && (
          <section className="glass-shell card glass p-6 space-y-4" style={{ borderRadius: 12 }}>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <h2 className="text-[#eeeae0] text-lg font-semibold flex items-center gap-2">
                  <FileText size={18} className="text-[#fb923c]" /> Similar Local Hospital Cases
                </h2>
                <p className="text-xs text-[#93a096] mt-0.5">Explore anonymized clinical assessment notes, chief complaints, and plans matching reference symptoms.</p>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93a096]" size={14} />
                <input
                  className="input pl-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Query matching symptoms..."
                />
              </div>
            </div>

            {casesLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#9fd8bd]" size={30} /></div>
            ) : relatedCases.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {relatedCases.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-[#eeeae0] text-sm">{c.firstName} {c.lastName}</span>
                        <div className="text-[10px] text-[#93a096] font-mono mt-0.5">MRN: {c.mrn}</div>
                      </div>
                      <span className="text-[10px] text-[#93a096]">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-[#fb923c] font-medium bg-[#fb923c]/5 p-2 rounded border border-[#fb923c]/15">
                      CC: {c.chiefComplaint || "No complaint recorded"}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="text-[#93a096] font-semibold">Assessment:</div>
                      <p className="text-[#eeeae0] leading-relaxed line-clamp-2">{c.assessment || "No notes"}</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="text-[#9fd8bd] font-semibold">Plan:</div>
                      <p className="text-[#eeeae0] leading-relaxed line-clamp-2">{c.plan || "No notes"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-[#93a096]">
                <FileSearch size={32} className="mx-auto mb-2 opacity-40" />
                Type symptoms in search box to explorer related cases.
              </div>
            )}
          </section>
        )}

        {activeTab === "governance" && isCmo && (
          <section className="grid grid-cols-12 gap-6 items-start">
            {/* Left side: Approvals Queue */}
            <div className="col-span-7 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 10 }}>
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <ShieldCheck size={16} className="text-[#9fd8bd]" />
                <h3 className="text-sm font-bold text-[#eeeae0] uppercase tracking-wide">CMO Guidelines & Protocols Approvals Queue</h3>
              </div>
              <p className="text-xs text-[#93a096]">As Chief Medical Officer, review and approve updates to clinical pathways, medication guidelines, and lab test thresholds before they are deployed to patient charts.</p>

              <div className="space-y-3">
                {approvalsQueue.map(item => (
                  <div key={item.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#eeeae0]">{item.title}</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-[#93a096] uppercase">{item.type}</span>
                      </div>
                      <div className="text-[10px] text-[#93a096] mt-1">Submitted by: Medical Informatics Team &middot; Status: <span className="text-[#fb923c] capitalize">{item.status.replace("_", " ")}</span></div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.status === "approved" ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-xs text-[#9fd8bd] flex items-center gap-1.5">
                          Approved
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              alert("Protocol changes rejected and sent back to editors.");
                            }}
                            className="btn-secondary px-3 py-1.5 text-[11px]"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setApprovalsQueue(prev => prev.map(x => x.id === item.id ? { ...x, status: "approved" } : x));
                            }}
                            className="btn-primary px-3 py-1.5 text-[11px]"
                          >
                            Approve
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Quality Metrics & Infection Control */}
            <div className="col-span-5 space-y-4">
              <div className="glass-shell card glass p-5 space-y-3" style={{ borderRadius: 10 }}>
                <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                  <Activity size={16} className="text-[#fb923c]" />
                  <h3 className="text-sm font-bold text-[#eeeae0] uppercase tracking-wide">CMO Quality Metrics & Infection Control</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="text-[#93a096] text-[10px] uppercase font-bold">Infection Rate</div>
                    <div className="text-lg font-bold text-[#9fd8bd] mt-1">0.14%</div>
                    <div className="text-[9px] text-[#93a096] mt-0.5">Target: &lt; 0.50%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="text-[#93a096] text-[10px] uppercase font-bold">30-Day Readmission</div>
                    <div className="text-lg font-bold text-[#9fd8bd] mt-1">2.8%</div>
                    <div className="text-[9px] text-[#93a096] mt-0.5">Target: &lt; 4.0%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="text-[#93a096] text-[10px] uppercase font-bold">Pathway Compliance</div>
                    <div className="text-lg font-bold text-[#9fd8bd] mt-1">96.4%</div>
                    <div className="text-[9px] text-[#93a096] mt-0.5">Target: &gt; 95%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div className="text-[#93a096] text-[10px] uppercase font-bold">Stewardship Alerts</div>
                    <div className="text-lg font-bold text-[#fb923c] mt-1">3 Active</div>
                    <div className="text-[9px] text-[#93a096] mt-0.5">Antimicrobial triggers</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "governance" && !isCmo && (
          <section className="grid grid-cols-12 gap-6 items-start">
            {/* Import Data Form */}
            <div className="col-span-5 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 10 }}>
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Database size={16} className="text-[#9fd8bd]" />
                <h3 className="text-sm font-bold text-[#eeeae0] uppercase tracking-wide">Import Source Datasets</h3>
              </div>
              <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#93a096]">Publisher / Dataset Type</label>
                  <select
                    className="input"
                    value={importSourceType}
                    onChange={e => setImportSourceType(e.target.value as any)}
                  >
                    <option value="cdc-icd10-cm">CDC ICD-10-CM (XML Tabular)</option>
                    <option value="rxnorm-prescribable">NIH RxNorm (RRF)</option>
                    <option value="loinc">LOINC (CSV)</option>
                    <option value="medlineplus">NIH MedlinePlus (XML)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[#93a096]">Version Label</label>
                    <input className="input" value={importVersion} onChange={e => setImportVersion(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[#93a096]">Published Date</label>
                    <input type="date" className="input" value={importPublishedDate} onChange={e => setImportPublishedDate(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#93a096]">Source Name</label>
                  <input className="input" value={importSourceName} onChange={e => setImportSourceName(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#93a096]">Source URL</label>
                  <input className="input" value={importSourceUrl} onChange={e => setImportSourceUrl(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#93a096]">Source File Content (XML, CSV, or Raw text)</label>
                  <textarea
                    className="input font-mono"
                    rows={6}
                    placeholder="Paste XML or CSV raw text data here..."
                    value={importContent}
                    onChange={e => setImportContent(e.target.value)}
                  />
                </div>

                {importError && <div className="text-red-400 font-semibold">{importError}</div>}
                
                <button type="submit" disabled={importing} className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-xs">
                  {importing ? <Loader2 size={13} className="animate-spin" /> : "Process Source Import"}
                </button>
              </form>

              {importSummary && (
                <div className="p-3 rounded-lg bg-[#9fd8bd]/15 border border-[#9fd8bd]/30 space-y-1 text-xs">
                  <div className="font-bold text-[#9fd8bd]">Import Summary: {importSummary.dataset}</div>
                  <div>Inserted: <strong>{importSummary.inserted}</strong></div>
                  <div>Updated: <strong>{importSummary.updated}</strong></div>
                  <div>Skipped: <strong>{importSummary.skipped}</strong></div>
                </div>
              )}
            </div>

            {/* Version control lists */}
            <div className="col-span-7 space-y-4">
              <div className="glass-shell card glass p-5 space-y-3" style={{ borderRadius: 10 }}>
                <h3 className="text-sm font-bold text-[#eeeae0] flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-[#9fd8bd]" /> Content Version Governance
                </h3>
                <p className="text-xs text-[#93a096]">Publish, retire, or roll back dataset catalogs. Authorized admin credentials required.</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[#93a096]">
                        <th className="py-2">Dataset</th>
                        <th className="py-2">Version</th>
                        <th className="py-2">Publisher</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contentVersions.map((v) => (
                        <tr key={v.id} className="border-b border-white/5 text-[#eeeae0]">
                          <td className="py-2.5 font-semibold capitalize">{v.dataset}</td>
                          <td className="py-2.5 font-mono text-[10px]">{v.versionLabel}</td>
                          <td className="py-2.5 text-[#93a096] truncate max-w-[120px]">{v.sourceName}</td>
                          <td className="py-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-[#9fd8bd] border border-emerald-500/20">{v.status}</span>
                          </td>
                          <td className="py-2.5 text-right space-x-1.5">
                            <button className="text-[10px] text-[#a3d1df] hover:underline">Rollback</button>
                            <button className="text-[10px] text-red-400 hover:underline">Retire</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

/* Tailored layout detail panel based on the selected item domain */
function TailoredDetailPanel({ selected, error }: { selected: any | null; error: string | null }) {
  if (error) return <div className="card glass text-red-400 text-sm p-4">{error}</div>;
  if (!selected) {
    return (
      <div className="glass-shell card glass flex flex-col items-center justify-center text-center min-h-[500px]" style={{ borderRadius: 12 }}>
        <BookOpen size={40} className="text-[#93a096] mb-3 stroke-1" />
        <div className="text-[#eeeae0] font-semibold text-sm">Select a reference item</div>
        <div className="text-[#93a096] text-xs mt-1">Detailed medical monographs will render here.</div>
      </div>
    );
  }

  const title = selected.name ?? selected.genericName ?? selected.testName ?? selected.studyName ?? selected.procedureName ?? selected.guidelineName;
  const domainType = selected.icd10Code ? "disease" : selected.drugClass ? "medication" : selected.specimenType ? "lab" : selected.modality ? "imaging" : selected.procedureName ? "procedure" : "guideline";

  return (
    <div className="glass-shell card glass space-y-6 min-h-[500px] p-6" style={{ borderRadius: 12 }}>
      
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-[#eeeae0] text-xl font-bold flex items-center gap-2">
            <BookOpen size={18} className="text-[#9fd8bd]" />
            {title}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#93a096]">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono font-bold capitalize text-[#9fd8bd]">{domainType}</span>
            <span>·</span>
            <span>{selected.icd10Code ?? selected.drugClass ?? selected.specimenType ?? selected.modality ?? selected.specialty}</span>
          </div>
        </div>

        {/* Provenance Card */}
        <div className="text-right text-[10px] text-[#93a096] bg-white/5 border border-white/10 p-2.5 rounded-lg space-y-0.5">
          <div className="font-semibold text-[#eeeae0]">Source Provenance</div>
          <div>Version: <span className="font-mono text-[#9fd8bd]">{selected.datasetVersion ?? selected.contentVersion ?? "starter-2026.06"}</span></div>
          <div>Evidence: <span className="capitalize">{selected.evidenceLevel ?? "Moderate"}</span></div>
          <div>Reviewed: {selected.lastReviewed ?? "2026-06-01"}</div>
        </div>
      </div>

      {/* Render layout shaped by domain */}
      {domainType === "disease" && (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <h4 className="text-[10px] text-[#9fd8bd] uppercase font-bold tracking-wider">Clinical Definition</h4>
            <p className="text-xs text-[#eeeae0] leading-relaxed">{selected.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 space-y-1.5">
              <h4 className="text-[10px] text-[#9fd8bd] uppercase font-bold tracking-wider">Clinical Presentation</h4>
              <p className="text-xs text-[#eeeae0] leading-relaxed">{selected.clinicalPresentation}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 space-y-1.5">
              <h4 className="text-[10px] text-[#fb923c] uppercase font-bold tracking-wider">Epidemiology</h4>
              <p className="text-xs text-[#eeeae0] leading-relaxed">{selected.epidemiology}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <h4 className="text-[10px] text-[#9fd8bd] uppercase font-bold tracking-wider">Symptoms</h4>
              <ul className="list-disc list-inside text-xs text-[#eeeae0] space-y-1">
                {selected.symptoms?.map((s: string) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <h4 className="text-[10px] text-[#fb923c] uppercase font-bold tracking-wider">Physical Signs</h4>
              <ul className="list-disc list-inside text-xs text-[#eeeae0] space-y-1">
                {selected.physicalSigns?.map((s: string) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div className="p-3.5 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1">
              <h4 className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Red Flags</h4>
              <ul className="list-disc list-inside text-xs text-red-300 space-y-1">
                {selected.emergencyRedFlags?.map((s: string) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 space-y-2">
              <h4 className="text-[10px] text-[#9fd8bd] uppercase font-bold tracking-wider">Investigations Required</h4>
              <div className="space-y-1 text-xs">
                <div><strong>Standard:</strong> {selected.recommendedInvestigations?.join(", ")}</div>
                {selected.laboratoryFindings?.length > 0 && <div><strong>Labs:</strong> {selected.laboratoryFindings.join(", ")}</div>}
                {selected.imagingFindings?.length > 0 && <div><strong>Imaging:</strong> {selected.imagingFindings.join(", ")}</div>}
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-white/5 border border-white/5 space-y-2">
              <h4 className="text-[10px] text-[#a3d1df] uppercase font-bold tracking-wider">Treatment Pathways</h4>
              <div className="space-y-1 text-xs">
                <div><strong>1st Line:</strong> {selected.firstLineTreatment?.join(", ")}</div>
                {selected.alternativeTreatment?.length > 0 && <div><strong>Alternative:</strong> {selected.alternativeTreatment.join(", ")}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {domainType === "medication" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <h4 className="text-[10px] text-[#93a096] uppercase font-bold">Brand Names</h4>
              <p className="text-xs text-[#eeeae0]">{selected.brandNames?.join(", ") || "No brand names recorded"}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <h4 className="text-[10px] text-[#9fd8bd] uppercase font-bold">Drug Class</h4>
              <p className="text-xs text-[#eeeae0]">{selected.drugClass} ({selected.therapeuticCategory})</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-2">
            <h4 className="text-[10px] text-[#a3d1df] uppercase font-bold">Dosing Guidelines</h4>
            <div className="grid grid-cols-2 gap-4 text-xs text-[#eeeae0]">
              <div>
                <span className="text-[#93a096] block mb-1">Adult Dosage</span>
                <p className="leading-relaxed whitespace-pre-wrap">{selected.adultDosing || "Not specified"}</p>
              </div>
              <div>
                <span className="text-[#93a096] block mb-1">Pediatric Dosage</span>
                <p className="leading-relaxed whitespace-pre-wrap">{selected.pediatricDosing || "Not specified"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1">
              <h4 className="text-[10px] text-red-400 uppercase font-bold">Contraindications</h4>
              <ul className="list-disc list-inside text-xs text-[#eeeae0] space-y-0.5">
                {selected.contraindications?.map((c: string) => <li key={c}>{c}</li>)}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <h4 className="text-[10px] text-[#fb923c] uppercase font-bold">Side Effects</h4>
              <ul className="list-disc list-inside text-xs text-[#eeeae0] space-y-0.5">
                {selected.sideEffects?.map((s: string) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-2">
            <h4 className="text-[10px] text-[#9fd8bd] uppercase font-bold">Safety & Adjustments</h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-2 rounded bg-white/5">
                <span className="text-[#93a096] block mb-0.5">Renal Adjustment</span>
                <span className="text-[#eeeae0]">{selected.renalDoseAdjustment || "No adjustment needed"}</span>
              </div>
              <div className="p-2 rounded bg-white/5">
                <span className="text-[#93a096] block mb-0.5">Hepatic Adjustment</span>
                <span className="text-[#eeeae0]">{selected.hepaticDoseAdjustment || "No adjustment needed"}</span>
              </div>
              <div className="p-2 rounded bg-[#fb923c]/5 border border-[#fb923c]/10">
                <span className="text-[#fb923c] block mb-0.5">Pregnancy Category</span>
                <span className="text-[#eeeae0] font-bold">{selected.pregnancyCategory || "Not specified"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {domainType === "lab" && (
        <div className="space-y-5">
          <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <h4 className="text-[10px] text-[#93a096] uppercase font-bold">Clinical Description</h4>
            <p className="text-xs text-[#eeeae0]">{selected.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-2">
              <h4 className="text-[10px] text-[#9fd8bd] uppercase font-bold">Reference Range</h4>
              <div className="text-sm font-bold text-[#eeeae0]">{selected.normalReferenceRange} {selected.units}</div>
              <div className="text-[10px] text-[#93a096] mt-1">Specimen: {selected.specimenType}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-2">
              <h4 className="text-[10px] text-[#a3d1df] uppercase font-bold">Patient Preparation</h4>
              <p className="text-xs text-[#eeeae0] leading-relaxed">{selected.preparation || "No special preparation required."}</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <h4 className="text-[10px] text-[#fb923c] uppercase font-bold">Clinical Significance</h4>
            <p className="text-xs text-[#eeeae0] leading-relaxed">{selected.clinicalInterpretation}</p>
          </div>
        </div>
      )}

      {domainType === "guideline" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <h4 className="text-[10px] text-[#93a096] uppercase font-bold">Clinical Scenario</h4>
            <p className="text-xs text-[#eeeae0] leading-relaxed">{selected.clinicalScenario}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-[10px] text-[#9fd8bd] uppercase font-bold tracking-wider">Protocol Steps</h4>
            <div className="relative border-l border-white/10 ml-3.5 pl-5 space-y-4 text-xs">
              {selected.workflowSteps?.map((step: string, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[27px] top-0 w-3.5 h-3.5 rounded-full bg-[#121614] border border-[#9fd8bd] flex items-center justify-center text-[9px] text-[#9fd8bd] font-bold">
                    {i + 1}
                  </div>
                  <p className="text-[#eeeae0] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sources list */}
      {selected.references?.length > 0 && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-1.5">
          <div className="text-[10px] text-[#93a096] uppercase font-bold tracking-wide">Sources & References</div>
          <div className="space-y-1">
            {selected.references.map((ref: any, idx: number) => (
              <div key={idx} className="text-xs text-[#93a096]">
                {ref.source ? `[${ref.source}] ` : ""}{ref.title} {ref.url && <a href={ref.url} target="_blank" rel="noreferrer" className="text-[#a3d1df] hover:underline">({ref.url})</a>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Calculators Dashboard Panel */
function CalculatorsDashboard({ calculators }: { calculators: CalculatorDefinition[] }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {calculators.map((calculator) => (
        <InteractiveCalculatorCard key={calculator.id} calculator={calculator} />
      ))}
    </div>
  );
}

/* Upgraded Interactive Calculator Card */
function InteractiveCalculatorCard({ calculator }: { calculator: CalculatorDefinition }) {
  const { calculate } = useClinicalKnowledgeStore();
  const [inputs, setInputs] = useState<Record<string, number | boolean | string>>({});
  const [result, setResult] = useState<any | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const handleInputChange = (key: string, type: string, value: string | boolean) => {
    let finalVal: number | boolean | string = value;
    if (type === "number") {
      finalVal = Number(value);
      // Basic range validation checks
      if (key === "age" && (finalVal < 0 || finalVal > 120)) {
        setValidationErrors(prev => ({ ...prev, [key]: "Age must be between 0 and 120." }));
      } else if (key === "weightKg" && (finalVal < 1 || finalVal > 300)) {
        setValidationErrors(prev => ({ ...prev, [key]: "Weight must be between 1 and 300 kg." }));
      } else if (key === "heightCm" && (finalVal < 30 || finalVal > 250)) {
        setValidationErrors(prev => ({ ...prev, [key]: "Height must be between 30 and 250 cm." }));
      } else {
        setValidationErrors(prev => {
          const cpy = { ...prev };
          delete cpy[key];
          return cpy;
        });
      }
    }
    setInputs(prev => ({ ...prev, [key]: finalVal }));
  };

  const handleRun = async () => {
    const res = await calculate(calculator.id, inputs);
    setResult(res);
  };

  const handleReset = () => {
    setInputs({});
    setResult(null);
    setValidationErrors({});
  };

  const handleCopy = () => {
    if (!result) return;
    const report = `${calculator.name} Score: ${result.score} (${result.category}). ${result.interpretation} Refs: ${calculator.references.join(", ")}`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-shell card glass p-5 space-y-4 flex flex-col justify-between" style={{ borderRadius: 12, minHeight: 330 }}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
          <Calculator size={16} className="text-[#9fd8bd]" />
          <div>
            <div className="text-[#eeeae0] text-sm font-bold">{calculator.name}</div>
            <div className="text-[#93a096] text-[10px] uppercase font-bold tracking-wider mt-0.5">{calculator.specialty}</div>
          </div>
        </div>

        <p className="text-xs text-[#93a096] leading-relaxed">{calculator.description}</p>

        {/* Inputs */}
        <div className="space-y-2 pt-1">
          {calculator.inputs.map((inp) => (
            <div key={inp.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-[#eeeae0]">
                <span>{inp.label}</span>
                {inp.type === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={!!inputs[inp.key]}
                    onChange={(e) => handleInputChange(inp.key, "boolean", e.target.checked)}
                  />
                ) : (
                  <input
                    type="number"
                    className="input"
                    style={{ width: 80, padding: "4px 8px" }}
                    value={(inputs[inp.key] as any) ?? ""}
                    onChange={(e) => handleInputChange(inp.key, "number", e.target.value)}
                  />
                )}
              </div>
              {validationErrors[inp.key] && (
                <div className="text-[10px] text-amber-400 text-right">{validationErrors[inp.key]}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary flex-1 text-xs py-1.5">Reset</button>
          <button onClick={handleRun} className="btn-primary flex-1 text-xs py-1.5">Calculate</button>
        </div>

        {/* Render Results */}
        {result && (
          <div className="p-3 rounded-lg bg-[#9fd8bd]/10 border border-[#9fd8bd]/25 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#9fd8bd] text-xs">Result: {result.score} - {result.category}</span>
              <button onClick={handleCopy} className="text-[#a3d1df] hover:underline flex items-center gap-1 text-[10px]">
                {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[10.5px] text-[#eeeae0] leading-relaxed">{result.interpretation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
