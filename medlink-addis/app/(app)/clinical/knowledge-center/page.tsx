"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  AlertTriangle, BookOpen, Calculator, Database, FileSearch, FlaskConical,
  Loader2, Pill, Search, ShieldCheck, Stethoscope, ChevronRight, Copy, Check,
  Info, FileText, Activity, ShieldAlert, Video, Eye, EyeOff, Plus, Trash2, CheckSquare,
  Square, Shield, Clock, Heart, PlusCircle, Thermometer, User, DollarSign, Layers,
  Phone, ArrowRight, Clipboard, RefreshCw
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
  const { profile, user } = useAuthStore();
  const userRoles = useMemo(() => {
    const rolesFromProfile = profile?.roles?.map((r: any) => r.name) || [];
    const rolesFromUser = user?.roles || [];
    return Array.from(new Set([...rolesFromProfile, ...rolesFromUser]));
  }, [profile, user]);

  const isAdminOrCmo = userRoles.includes("hospital_admin") || userRoles.includes("super_admin") || userRoles.includes("medical_director");
  const isCmo = userRoles.includes("medical_director");

  // Resolve default active role from user profile roles
  const defaultRole = useMemo(() => {
    if (userRoles.includes("nurse")) return "nurse";
    if (userRoles.includes("pharmacist")) return "pharmacist";
    if (userRoles.includes("lab_technician")) return "lab_staff";
    if (userRoles.includes("radiologist")) return "radiologist";
    if (userRoles.includes("receptionist")) return "receptionist";
    if (userRoles.includes("cashier") || userRoles.includes("finance_officer")) return "billing";
    if (userRoles.includes("emergency") || userRoles.includes("triage_nurse")) return "emergency";
    
    // Specialists
    const email = (profile?.email || "").toLowerCase();
    if (userRoles.includes("specialist") || userRoles.includes("doctor")) {
      if (email.includes("cardio")) return "cardiologist";
      if (email.includes("pulmo")) return "pulmonologist";
      return "doctor";
    }
    
    return "doctor"; // Default fallback
  }, [userRoles, profile]);

  // Simulated Role selector for testing/demo adaptive workspaces
  const [simulatedRole, setSimulatedRole] = useState<string>("");
  const activeRole = simulatedRole || defaultRole;

  const [activeTab, setActiveTab] = useState<string>("reference");

  // Automatically set default tab on role load
  useEffect(() => {
    if (activeRole === "doctor" || activeRole === "cardiologist" || activeRole === "pulmonologist") {
      setActiveTab("reference");
    } else {
      setActiveTab("dashboard");
    }
  }, [activeRole]);

  // CMO Guideline approvals state
  const [approvalsQueue, setApprovalsQueue] = useState([
    { id: "app-1", title: "CURB-65 Pneumonia Pathway Update v2.1", type: "Clinical Guideline", status: "pending_approval" },
    { id: "app-2", title: "Surgical Prophylaxis Guidelines 2026", type: "Treatment Protocol", status: "pending_approval" },
    { id: "app-3", title: "Artemether-Lumefantrine Pediatric Drug Protocol v1.4", type: "Drug Protocol", status: "pending_approval" }
  ]);

  const {
    query, domain, specialty, results, selected, calculators, specialties, loading, error,
    setQuery, setDomain, setSpecialty, bootstrap, search, loadDetail
  } = useClinicalKnowledgeStore();

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

  // Sub-workspace states for specific roles
  // 1. Nurse workspace state
  const [nurseVitalsForm, setNurseVitalsForm] = useState({ bpSys: "120", bpDia: "80", hr: "72", temp: "37.0", spo2: "98" });
  const [nurseMAR, setNurseMAR] = useState([
    { id: "mar-1", time: "08:00", drug: "Ceftriaxone 1g IV", patient: "Bekele Worku", administered: false },
    { id: "mar-2", time: "09:00", drug: "Paracetamol 500mg PO", patient: "Aster Mamo", administered: true },
    { id: "mar-3", time: "12:00", drug: "Lisinopril 10mg PO", patient: "Yonas Alemu", administered: false },
  ]);
  const [nurseTasks, setNurseTasks] = useState([
    { id: "t-1", text: "Record post-op vitals for Bed 102", done: false },
    { id: "t-2", text: "Perform wound care dress replacement for Bed 204", done: true },
    { id: "t-3", text: "Insert IV line for incoming emergency triage", done: false },
  ]);
  const [shiftHandoverNotes, setShiftHandoverNotes] = useState("Ward 4B general stable. Bed 102 monitored for transient hypokalemia post-diuretics. All morning IV meds administered.");

  // 2. Pharmacist workspace state
  const [pharmaCheck1, setPharmaCheck1] = useState("warfarin");
  const [pharmaCheck2, setPharmaCheck2] = useState("aspirin");
  const [pharmaStock, setPharmaStock] = useState([
    { drug: "Amoxicillin 500mg Caps", qty: 450, expiry: "2027-04-12", status: "Normal" },
    { drug: "Metoprolol 50mg Tabs", qty: 25, expiry: "2026-08-30", status: "Low Stock" },
    { drug: "Warfarin 5mg Tabs", qty: 180, expiry: "2026-07-15", status: "Critical / Expiry" },
  ]);

  // 3. Lab staff workspace state
  const [labQC, setLabQC] = useState([
    { test: "Complete Blood Count (Sysmex-500)", run: "Morning Control 1", status: "Passed", date: "Today 07:15" },
    { test: "Serum Potassium (Cobas-c311)", run: "Calibrator Run A", status: "Passed", date: "Today 07:45" },
    { test: "Cardiac Troponin I", run: "QC Level 2", status: "Critical Out-of-Range", date: "Today 08:30" },
  ]);

  // Differential Diagnosis Finder State
  const [symptomList, setSymptomList] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [differentials, setDifferentials] = useState<any[]>([]);
  const [diffLoading, setDiffLoading] = useState(false);

  // 4. Radiologist workspace state
  const [imagingTemplateType, setImagingTemplateType] = useState("cxr");
  const imagingTemplates = {
    cxr: `CHEST 2 VIEWS (PA & LATERAL):\n\nCLINICAL HISTORY: Cough and fever.\nFINDINGS:\n- Lungs are clear without focal consolidation or effusion.\n- Cardiomediastinal silhouette is normal in size.\n- Osseous structures are intact.\n\nIMPRESSION: No acute cardiopulmonary abnormality.`,
    brain: `CT HEAD WITHOUT CONTRAST:\n\nCLINICAL HISTORY: Acute headache, rule out bleed.\nFINDINGS:\n- No acute intracranial hemorrhage or mass effect.\n- Ventricles and sulci are normal for age.\n- Visualized paranasal sinuses are clear.\n\nIMPRESSION: Negative CT of the brain.`
  };

  // 5. ED workspace state
  const [edDoseWeight, setEdDoseWeight] = useState("70");

  // 6. Billing workspace state
  const [billingCodes, setBillingCodes] = useState([
    { code: "99213", desc: "Outpatient Office Visit (15-20 min)", price: "450 ETB" },
    { code: "85025", desc: "CBC with Automated Diff", price: "280 ETB" },
    { code: "93000", desc: "12-Lead Electrocardiogram ECG", price: "350 ETB" },
    { code: "36415", desc: "Venipuncture Sample Collection", price: "120 ETB" },
  ]);

  useEffect(() => {
    bootstrap().catch(() => {});
  }, [bootstrap]);

  useEffect(() => {
    const handle = setTimeout(() => {
      search();
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

  // Roles configuration selector
  const roles = [
    { id: "doctor", label: "Medical Doctor" },
    { id: "cardiologist", label: "Specialist - Cardiologist" },
    { id: "pulmonologist", label: "Specialist - Pulmonologist" },
    { id: "nurse", label: "Ward / Intake Nurse" },
    { id: "pharmacist", label: "Clinical Pharmacist" },
    { id: "lab_staff", label: "Laboratory Scientist" },
    { id: "radiologist", label: "Radiologist" },
    { id: "receptionist", label: "Receptionist" },
    { id: "billing", label: "Billing & Cashier" },
    { id: "emergency", label: "Emergency Room Staff" }
  ];

  return (
    <>
      <Topbar title="Clinical Knowledge Center" />
      <main className="p-6 space-y-6">
        
        {/* Dynamic Header Banner with Role Simulator Dropdown */}
        <section className="glass-shell card glass p-6 space-y-4" style={{ borderRadius: 12 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[#9fd8bd] text-xs font-semibold uppercase tracking-wide">
                <Database size={14} /> Shared Decision-Support Reference
              </div>
              <h1 className="text-[#eeeae0] text-xl font-bold mt-1">Adaptive Clinical Knowledge Center</h1>
              <p className="text-[#93a096] text-xs mt-1 max-w-2xl">
                Dynamic clinical reference, manuals, protocols, and interactive calculators adapted to your active role.
              </p>
            </div>
            
            {isAdminOrCmo && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#93a096] font-semibold uppercase">Simulate Role:</span>
                <select
                  value={simulatedRole}
                  onChange={e => {
                    setSimulatedRole(e.target.value);
                    // Reset tab to default when changing simulated role
                    setActiveTab(e.target.value === "doctor" || e.target.value === "cardiologist" || e.target.value === "pulmonologist" ? "reference" : "dashboard");
                  }}
                  className="bg-[#070b09] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#9fd8bd] font-bold focus:outline-none focus:border-[#9fd8bd]"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* MEDICAL DOCTOR / SPECIALISTS WORKSPACE                         */}
        {/* ============================================================== */}
        {(activeRole === "doctor" || activeRole === "cardiologist" || activeRole === "pulmonologist") && (
          <>
            {/* Top Workspace Tab Navs */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 w-max">
              <button onClick={() => setActiveTab("reference")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "reference" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>Reference Center</button>
              <button onClick={() => setActiveTab("differential")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "differential" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>Differential Diagnosis Finder</button>
              <button onClick={() => setActiveTab("calculators")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "calculators" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>Calculators</button>
              {activeRole === "cardiologist" && (
                <button onClick={() => setActiveTab("cardio")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "cardio" ? "bg-red-400 text-black font-bold" : "text-[#93a096] hover:text-white"}`}>❤️ Cardiology Workspace</button>
              )}
              {activeRole === "pulmonologist" && (
                <button onClick={() => setActiveTab("pulmo")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "pulmo" ? "bg-sky-400 text-black font-bold" : "text-[#93a096] hover:text-white"}`}>🫁 Pulmonary Workspace</button>
              )}
              {isAdminOrCmo && (
                <button onClick={() => setActiveTab("governance")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "governance" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>{isCmo ? "CMO Governance" : "Governance & Imports"}</button>
              )}
            </div>

            {activeTab === "reference" && (
              <section className="grid grid-cols-12 gap-6 items-start animate-fade-in">
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
                                selected?.id === item.id ? "bg-white/10 border-[#9fd8bd]/40" : "bg-white/5 border-white/5 hover:bg-white/10"
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
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-8">
                  <TailoredDetailPanel selected={selected} error={error} />
                </div>
              </section>
            )}

            {activeTab === "differential" && (
              <section className="grid grid-cols-12 gap-6 items-start animate-fade-in">
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

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {symptomList.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded bg-[#9fd8bd]/10 border border-[#9fd8bd]/25 text-xs text-[#9fd8bd] flex items-center gap-1.5">
                          {s}
                          <button onClick={() => setSymptomList(prev => prev.filter(x => x !== s))} className="hover:text-red-400 font-bold text-[10px]">&times;</button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => { setSymptomList([]); setDifferentials([]); }} className="btn-secondary flex-1 text-xs py-2">Reset Profile</button>
                      <button
                        disabled={symptomList.length === 0 || diffLoading}
                        onClick={async () => {
                          setDiffLoading(true);
                          try {
                            const res = await api.post("/clinical-knowledge/differential", { symptoms: symptomList });
                            setDifferentials(res.data.diseases ?? res.data.data?.diseases ?? []);
                          } catch (err) {
                            console.error(err);
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
                              <p className="text-[11px] text-[#93a096] mt-0.5">{item.disease.description}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-500/10 text-[#9fd8bd] border border-emerald-500/25">
                              {Math.round(item.score * 100)}% Match
                            </span>
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

            {/* ❤️ CARDIOLOGIST workspace panel */}
            {activeTab === "cardio" && (
              <section className="grid grid-cols-12 gap-6 items-start animate-fade-in">
                <div className="col-span-6 space-y-6">
                  {/* ECG wave mockup */}
                  <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase">
                        <Activity size={14} className="animate-pulse" />
                        <span>Interactive 12-Lead ECG Visualizer</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-mono font-bold">LIVE TELEMETRY</span>
                    </div>

                    {/* SVG ECG wave trace */}
                    <div className="h-32 bg-black/60 border border-white/5 rounded-xl flex items-center justify-center p-3 relative overflow-hidden">
                      <svg viewBox="0 0 400 100" className="w-full h-full text-red-400" preserveAspectRatio="none">
                        <path
                          d="M 0 50 L 50 50 L 55 40 L 60 60 L 65 50 L 100 50 L 105 10 L 112 90 L 118 50 L 150 50 L 158 55 L 168 45 L 175 50 L 220 50 L 225 40 L 230 60 L 235 50 L 270 50 L 275 10 L 282 90 L 288 50 L 320 50 L 328 55 L 338 45 L 345 50 L 400 50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs pt-1">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-[#93a096] text-[9px] uppercase font-semibold">QRS Duration</div>
                        <div className="text-[#eeeae0] font-bold mt-0.5">86 ms</div>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-[#93a096] text-[9px] uppercase font-semibold">QTc Interval</div>
                        <div className="text-[#eeeae0] font-bold mt-0.5">412 ms</div>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-[#93a096] text-[9px] uppercase font-semibold">PR Interval</div>
                        <div className="text-[#eeeae0] font-bold mt-0.5">144 ms</div>
                      </div>
                    </div>
                  </div>

                  {/* Cardiac markers chart */}
                  <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                    <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Cardiac Troponins I Marker Serial Progression</h3>
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/5 text-[#93a096]">
                          <th className="py-2">Interval Time</th>
                          <th className="py-2">Troponin Value</th>
                          <th className="py-2">Threshold Limit</th>
                          <th className="py-2 text-right">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/5 text-[#eeeae0]">
                          <td className="py-2">Admit (0 Hours)</td>
                          <td className="py-2 font-mono">0.02 ng/mL</td>
                          <td className="py-2 text-[#93a096]">&lt; 0.04 ng/mL</td>
                          <td className="py-2 text-right text-emerald-400 font-bold">Normal Baseline</td>
                        </tr>
                        <tr className="border-b border-white/5 text-[#eeeae0]">
                          <td className="py-2">+3 Hours</td>
                          <td className="py-2 font-mono text-amber-400 font-bold">0.18 ng/mL</td>
                          <td className="py-2 text-[#93a096]">&lt; 0.04 ng/mL</td>
                          <td className="py-2 text-right text-amber-400 font-bold">Elevated (Rule In)</td>
                        </tr>
                        <tr className="border-b border-white/5 text-[#eeeae0]">
                          <td className="py-2">+6 Hours</td>
                          <td className="py-2 font-mono text-red-400 font-bold">1.45 ng/mL</td>
                          <td className="py-2 text-[#93a096]">&lt; 0.04 ng/mL</td>
                          <td className="py-2 text-right text-red-400 font-bold">Critical Out-of-Range</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="col-span-6 space-y-6">
                  {/* Guidelines & calculators list */}
                  <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                      <Heart size={15} className="text-red-400" />
                      <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Cardiology calculators & Heart Failure guidelines</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                        <div className="font-bold text-xs text-[#eeeae0]">ACC/AHA Heart Failure Staging Protocol</div>
                        <p className="text-[11px] text-[#93a096] leading-relaxed">
                          Stage A (At-risk) &rarr; Stage B (Pre-HF, structural) &rarr; Stage C (Symptomatic HF) &rarr; Stage D (Advanced, refractory).
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                        <div className="font-bold text-xs text-[#eeeae0]">Cardiac Medications Reference</div>
                        <div className="flex flex-wrap gap-1.5">
                          {["Metoprolol", "Lisinopril", "Aspirin", "Clopidogrel", "Atorvastatin"].map(m => (
                            <span key={m} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10.5px] text-[#93a096]">{m}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 🫁 PULMONOLOGIST workspace panel */}
            {activeTab === "pulmo" && (
              <section className="grid grid-cols-12 gap-6 items-start animate-fade-in">
                <div className="col-span-6 space-y-6">
                  <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                      <Activity size={14} className="text-sky-400" />
                      <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">GOLD Spirometry COPD Staging Criteria</h3>
                    </div>
                    <p className="text-xs text-[#93a096]">Post-bronchodilator FEV1/FVC &lt; 0.70 confirms airflow limitation.</p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-white/5 rounded border border-white/5 flex justify-between">
                        <span>GOLD 1 (Mild)</span>
                        <span className="font-mono text-[#9fd8bd] font-bold">FEV1 &ge; 80% predicted</span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded border border-white/5 flex justify-between">
                        <span>GOLD 2 (Moderate)</span>
                        <span className="font-mono text-sky-400 font-bold">50% &le; FEV1 &lt; 80% predicted</span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded border border-white/5 flex justify-between">
                        <span>GOLD 3 (Severe)</span>
                        <span className="font-mono text-amber-400 font-bold">30% &le; FEV1 &lt; 50% predicted</span>
                      </div>
                      <div className="p-2.5 bg-white/5 rounded border border-white/5 flex justify-between">
                        <span>GOLD 4 (Very Severe)</span>
                        <span className="font-mono text-red-400 font-bold">FEV1 &lt; 30% predicted</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-6 space-y-6">
                  <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                    <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Respiratory reference & guidelines</h3>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                      <div className="font-bold text-xs text-[#eeeae0]">Asthma Severity Classification</div>
                      <p className="text-[11.5px] text-[#93a096] leading-relaxed">
                        Intermittent vs. Persistent (Mild, Moderate, Severe). Steps up treatment based on SABA rescue inhaler usage frequencies.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "governance" && (
              <section className="grid grid-cols-12 gap-6 items-start">
                <div className="col-span-12">
                  <h2 className="text-sm font-bold text-[#eeeae0]">Administrators Settings & Dataset governance</h2>
                </div>
              </section>
            )}
          </>
        )}

        {/* ============================================================== */}
        {/* NURSE WORKSPACE                                                */}
        {/* ============================================================== */}
        {activeRole === "nurse" && (
          <section className="space-y-6 animate-fade-in">
            {/* Top Workspace Tab Navs */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 w-max">
              <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "dashboard" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>Nursing Desk</button>
              <button onClick={() => setActiveTab("mar")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "mar" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>MAR & Medication Schedule</button>
              <button onClick={() => setActiveTab("handover")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "handover" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>Shift Handover & Care Plans</button>
            </div>

            {activeTab === "dashboard" && (
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Vitals Logger */}
                <div className="col-span-5 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <Thermometer size={16} className="text-[#9fd8bd]" />
                    <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Quick Patient Vitals Registry</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[#93a096]">BP Systolic (mmHg)</label>
                      <input className="input" value={nurseVitalsForm.bpSys} onChange={e => setNurseVitalsForm({...nurseVitalsForm, bpSys: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#93a096]">BP Diastolic (mmHg)</label>
                      <input className="input" value={nurseVitalsForm.bpDia} onChange={e => setNurseVitalsForm({...nurseVitalsForm, bpDia: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#93a096]">Heart Rate (bpm)</label>
                      <input className="input" value={nurseVitalsForm.hr} onChange={e => setNurseVitalsForm({...nurseVitalsForm, hr: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#93a096]">Temperature (&deg;C)</label>
                      <input className="input" value={nurseVitalsForm.temp} onChange={e => setNurseVitalsForm({...nurseVitalsForm, temp: e.target.value})} />
                    </div>
                  </div>

                  <button onClick={() => alert(`Vitals saved: BP ${nurseVitalsForm.bpSys}/${nurseVitalsForm.bpDia}, HR ${nurseVitalsForm.hr}`)} className="btn-primary w-full py-2 text-xs">Record & Save Vitals</button>
                </div>

                {/* Tasks List */}
                <div className="col-span-7 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <CheckSquare size={16} className="text-sky-400" />
                    <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Nursing Task List & Assessments</h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    {nurseTasks.map(t => (
                      <div key={t.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                        <span className={t.done ? "line-through text-[#93a096]" : "text-[#eeeae0]"}>{t.text}</span>
                        <button
                          onClick={() => setNurseTasks(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))}
                          className={`px-3 py-1 rounded text-[10px] font-bold ${t.done ? "bg-emerald-500/10 text-[#9fd8bd]" : "bg-white/5 text-[#93a096]"}`}
                        >
                          {t.done ? "Completed" : "Mark Done"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "mar" && (
              <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                  <Pill size={16} className="text-red-400" />
                  <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Medication Administration Record (MAR) sign-off</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[#93a096]">
                        <th className="py-2">Scheduled Time</th>
                        <th className="py-2">Medication</th>
                        <th className="py-2">Patient</th>
                        <th className="py-2 text-right">Status / Administration Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nurseMAR.map(item => (
                        <tr key={item.id} className="border-b border-white/5 text-[#eeeae0]">
                          <td className="py-3 font-mono">{item.time}</td>
                          <td className="py-3 font-bold">{item.drug}</td>
                          <td className="py-3">{item.patient}</td>
                          <td className="py-3 text-right">
                            {item.administered ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Administered</span>
                            ) : (
                              <button
                                onClick={() => setNurseMAR(prev => prev.map(x => x.id === item.id ? { ...x, administered: true } : x))}
                                className="btn-primary py-1 px-3 text-[10px] uppercase font-bold"
                              >
                                Sign & Administer
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "handover" && (
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Handover summary */}
                <div className="col-span-6 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <Clipboard size={16} className="text-[#9fd8bd]" />
                    <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Nursing Shift Handover Notes</h3>
                  </div>
                  <textarea
                    className="input text-xs leading-relaxed"
                    rows={6}
                    value={shiftHandoverNotes}
                    onChange={e => setShiftHandoverNotes(e.target.value)}
                  />
                  <button onClick={() => alert("Handover notes saved and transmitted to incoming shift team!")} className="btn-primary text-xs py-2 w-full">Sign Handover report</button>
                </div>

                {/* Nursing care plans */}
                <div className="col-span-6 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                  <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Standard Nursing Care Plans & Calculators</h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                      <div className="font-bold text-xs text-[#eeeae0]">IV Drip Rate Calculator</div>
                      <p className="text-[10px] text-[#93a096]">Drip rate (gtt/min) = (Volume in mL &times; Drop Factor) &divide; Time in mins.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* CLINICAL PHARMACIST WORKSPACE                                  */}
        {/* ============================================================== */}
        {activeRole === "pharmacist" && (
          <section className="space-y-6 animate-fade-in">
            {/* Top Workspace Tab Navs */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 w-max">
              <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "dashboard" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>Interaction Checker</button>
              <button onClick={() => setActiveTab("stock")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "stock" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>Inventory stock & Expiry</button>
            </div>

            {activeTab === "dashboard" && (
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Interaction Checker */}
                <div className="col-span-5 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <Pill size={16} className="text-[#9fd8bd]" />
                    <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Multi-Drug Interaction Checker</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[#93a096]">Medication 1</label>
                      <input className="input" value={pharmaCheck1} onChange={e => setPharmaCheck1(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#93a096]">Medication 2</label>
                      <input className="input" value={pharmaCheck2} onChange={e => setPharmaCheck2(e.target.value)} />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (pharmaCheck1.toLowerCase().includes("warfarin") && pharmaCheck2.toLowerCase().includes("aspirin")) {
                        alert("Interaction Detected: Warfarin + Aspirin. Increased risk of severe gastrointestinal bleeding!");
                      } else {
                        alert("No severe interactions logged for this combination.");
                      }
                    }}
                    className="btn-primary w-full py-2 text-xs"
                  >
                    Run Interaction Check
                  </button>
                </div>

                {/* Adjustments helper */}
                <div className="col-span-7 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                  <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Renal & Hepatic Dose Adjustments Reference</h3>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-2">
                    <div className="font-bold text-[#9fd8bd]">Creatinine Clearance (Cockcroft-Gault GFR) Calculator</div>
                    <p className="text-[11px] text-[#93a096]">
                      eGFR = ((140 - Age) &times; Weight in kg) &divide; (72 &times; Serum Creatinine in mg/dL). Multiply by 0.85 for female patients.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "stock" && (
              <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Critical Pharmacy stock levels & Expiry monitor</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[#93a096]">
                        <th className="py-2">Medication Name</th>
                        <th className="py-2">Current Stock</th>
                        <th className="py-2">Expiry Date</th>
                        <th className="py-2 text-right">Status Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pharmaStock.map((s, idx) => (
                        <tr key={idx} className="border-b border-white/5 text-[#eeeae0]">
                          <td className="py-3 font-semibold">{s.drug}</td>
                          <td className="py-3 font-mono">{s.qty} units</td>
                          <td className="py-3 font-mono">{s.expiry}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === "Normal" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                            }`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* LABORATORY SCIENTIST WORKSPACE                                 */}
        {/* ============================================================== */}
        {activeRole === "lab_staff" && (
          <section className="space-y-6 animate-fade-in">
            {/* Top Workspace Tab Navs */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 w-max">
              <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "dashboard" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>QC & Calibration log</button>
              <button onClick={() => setActiveTab("manual")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "manual" ? "bg-[#9fd8bd] text-[#070b09] font-bold" : "text-[#93a096] hover:text-white"}`}>LOINC Reference ranges</button>
            </div>

            {activeTab === "dashboard" && (
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* QC logs */}
                <div className="col-span-7 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <FlaskConical size={16} className="text-[#9fd8bd]" />
                    <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Daily Laboratory Equipment Quality Control (QC) run</h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    {labQC.map((q, idx) => (
                      <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#eeeae0]">{q.test}</div>
                          <div className="text-[9.5px] text-[#93a096] mt-0.5">{q.run} &bull; {q.date}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.status === "Passed" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {q.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Guidelines */}
                <div className="col-span-5 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                  <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Sample collection SOPs & Critical Values</h3>
                  <div className="space-y-3 text-xs text-[#eeeae0]">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                      <div className="text-[#9fd8bd] font-bold">EDTA Lavender Top Tube</div>
                      <p className="text-[10px] text-[#93a096] mt-0.5">Required for Complete Blood Count. Invert 8 times immediately to prevent micro-clotting.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "manual" && (
              <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Laboratory Manual Reference Ranges</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[#93a096]">
                        <th className="py-2">LOINC Code</th>
                        <th className="py-2">Lab Test Name</th>
                        <th className="py-2">Standard Reference Range</th>
                        <th className="py-2 text-right">Specimen type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5 text-[#eeeae0]">
                        <td className="py-3 font-mono">2951-2</td>
                        <td className="py-3 font-semibold">Sodium, Serum</td>
                        <td className="py-3">135 &mdash; 145 mmol/L</td>
                        <td className="py-3 text-right">Serum (Gold Top SST)</td>
                      </tr>
                      <tr className="border-b border-white/5 text-[#eeeae0]">
                        <td className="py-3 font-mono">2823-3</td>
                        <td className="py-3 font-semibold">Potassium, Serum</td>
                        <td className="py-3 text-red-400 font-bold">3.5 &mdash; 5.0 mmol/L</td>
                        <td className="py-3 text-right">Serum (Gold Top SST)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* RADIOLOGIST WORKSPACE                                          */}
        {/* ============================================================== */}
        {activeRole === "radiologist" && (
          <section className="grid grid-cols-12 gap-6 items-start animate-fade-in">
            {/* Reporting templates */}
            <div className="col-span-6 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Reporting Dictation Templates</h3>
                <select
                  value={imagingTemplateType}
                  onChange={e => setImagingTemplateType(e.target.value)}
                  className="bg-black/40 border border-white/10 text-xs rounded p-1 text-[#eeeae0]"
                >
                  <option value="cxr">Chest X-Ray PA/Lat</option>
                  <option value="brain">CT Brain Non-Contrast</option>
                </select>
              </div>

              <textarea
                className="input font-mono text-xs leading-relaxed"
                rows={10}
                value={imagingTemplates[imagingTemplateType as keyof typeof imagingTemplates]}
                readOnly
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(imagingTemplates[imagingTemplateType as keyof typeof imagingTemplates]);
                  alert("Template copied to clipboard!");
                }}
                className="btn-primary text-xs w-full py-2 flex items-center justify-center gap-1.5"
              >
                <Copy size={13} /> Copy Dictation Template
              </button>
            </div>

            {/* Contrast safety & Image guidelines */}
            <div className="col-span-6 space-y-6">
              <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
                <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Contrast Safety checklist & Protocols</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                    <div className="text-amber-400 font-bold">Contrast Induced Nephropathy CIN Risk</div>
                    <p className="text-[10px] text-[#93a096]">Check patient eGFR. If eGFR &lt; 30 mL/min, consult provider to administer IV hydration protocol or switch to un-contrasted studies.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* RECEPTIONIST WORKSPACE                                         */}
        {/* ============================================================== */}
        {activeRole === "receptionist" && (
          <section className="grid grid-cols-12 gap-6 items-start animate-fade-in">
            {/* FAQ & Hospital Services */}
            <div className="col-span-7 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Info size={16} className="text-[#9fd8bd]" />
                <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Patient Front-Desk FAQ</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                  <div className="font-bold text-[#eeeae0] mb-1">What insurance companies are accepted?</div>
                  <p className="text-[#93a096]">We accept Medhin, Nyala, Tsehay, United Insurance, and federal civil employee covers.</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                  <div className="font-bold text-[#eeeae0] mb-1">What are the outpatient visiting hours?</div>
                  <p className="text-[#93a096]">Visiting hours are strictly 06:00 - 08:00 (Morning), 12:00 - 14:00 (Lunchtime), and 17:00 - 20:00 (Evening).</p>
                </div>
              </div>
            </div>

            {/* Telephone directories */}
            <div className="col-span-5 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
              <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Emergency & Dept Phone Directory</h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>ER Command desk</span>
                  <span className="text-[#9fd8bd] font-bold">Ext. 911 / 102</span>
                </div>
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>Pharmacy Dispatch</span>
                  <span className="text-[#9fd8bd] font-bold">Ext. 301</span>
                </div>
                <div className="flex justify-between p-2 bg-white/5 rounded">
                  <span>LOINC lab room</span>
                  <span className="text-[#9fd8bd] font-bold">Ext. 402</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* BILLING / CASHIER WORKSPACE                                    */}
        {/* ============================================================== */}
        {activeRole === "billing" && (
          <section className="glass-shell card glass p-5 space-y-4 animate-fade-in" style={{ borderRadius: 12 }}>
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
              <DollarSign size={16} className="text-[#9fd8bd]" />
              <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Standard CPT Billing Codes & Pricing packages</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[#93a096]">
                    <th className="py-2">CPT Code</th>
                    <th className="py-2">Procedure / consultation Description</th>
                    <th className="py-2 text-right">Standard price (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  {billingCodes.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 text-[#eeeae0]">
                      <td className="py-3 font-mono">{item.code}</td>
                      <td className="py-3 font-semibold">{item.desc}</td>
                      <td className="py-3 text-right font-bold text-[#9fd8bd]">{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* EMERGENCY ROOM WORKSPACE                                       */}
        {/* ============================================================== */}
        {activeRole === "emergency" && (
          <section className="grid grid-cols-12 gap-6 items-start animate-fade-in">
            {/* ED Drug Calculator */}
            <div className="col-span-5 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Calculator size={16} className="text-red-400" />
                <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">Emergency Code Drug Dosing Calculator</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[#93a096]">Patient Weight (kg)</label>
                  <input
                    type="number"
                    className="input font-mono"
                    value={edDoseWeight}
                    onChange={e => setEdDoseWeight(e.target.value)}
                  />
                </div>

                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                  <div className="font-bold text-red-400 text-xs">IV Epinephrine (Code Dosing 1:10,000)</div>
                  <div className="text-lg font-bold text-[#eeeae0] font-mono">
                    {(Number(edDoseWeight) * 0.01).toFixed(2)} mg IV
                  </div>
                  <p className="text-[9px] text-[#93a096]">Dose check: 0.01 mg/kg. Administer every 3-5 minutes during active cardiopulmonary arrest.</p>
                </div>
              </div>
            </div>

            {/* ED Protocols */}
            <div className="col-span-7 glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
              <h3 className="text-xs font-bold text-[#eeeae0] uppercase tracking-wide">STEMI & Stroke Protocol checklist</h3>
              <div className="space-y-3 text-xs text-[#eeeae0]">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                  <div className="text-sky-400 font-bold">Acute Stroke Code Protocol (Door-to-Needle &lt; 60 mins)</div>
                  <p className="text-[10px] text-[#93a096] leading-relaxed">
                    0-10m: Assess ABCs & vitals &middot; 0-25m: CT Head (rule out hemorrhage) &middot; 0-45m: Interpret CT & labs &middot; 0-60m: Initiate tPA thrombolysis if eligible.
                  </p>
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
            <span>&middot;</span>
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

/* Interactive Calculator Card */
function InteractiveCalculatorCard({ calculator }: { calculator: CalculatorDefinition }) {
  const { calculate } = useClinicalKnowledgeStore();
  const [inputs, setInputs] = useState<Record<string, number | boolean | string>>({});
  const [result, setResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (key: string, type: string, value: string | boolean) => {
    let finalVal: number | boolean | string = value;
    if (type === "number") {
      finalVal = Number(value);
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
  };

  return (
    <div className="glass-shell card glass p-5 space-y-4 flex flex-col justify-between" style={{ borderRadius: 12, minHeight: 300 }}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
          <Calculator size={16} className="text-[#9fd8bd]" />
          <div>
            <div className="text-[#eeeae0] text-sm font-bold">{calculator.name}</div>
            <div className="text-[#93a096] text-[10px] uppercase font-bold tracking-wider mt-0.5">{calculator.specialty}</div>
          </div>
        </div>

        <p className="text-xs text-[#93a096] leading-relaxed">{calculator.description}</p>

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
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary flex-1 text-xs py-1.5">Reset</button>
          <button onClick={handleRun} className="btn-primary flex-1 text-xs py-1.5">Calculate</button>
        </div>

        {result && (
          <div className="p-3 rounded-lg bg-[#9fd8bd]/10 border border-[#9fd8bd]/25 space-y-1">
            <span className="font-bold text-[#9fd8bd] text-xs">Result: {result.score} - {result.category}</span>
            <p className="text-[10.5px] text-[#eeeae0] leading-relaxed">{result.interpretation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
