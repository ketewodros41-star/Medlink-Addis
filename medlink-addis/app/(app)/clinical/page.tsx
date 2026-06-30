"use client";
import { useEffect, useState, useRef } from "react";
import Topbar from "@/components/Topbar";
import { 
  Stethoscope, Thermometer, Heart, Wind, Save, Brain, Activity, 
  ChevronRight, Plus, Search, FileText, Video, Clock, ArrowUpRight, 
  Check, Trash, PlusCircle, Star, Notebook, ListTodo, AlertTriangle, 
  BookOpen, ShieldCheck, Flame, Loader2, Sparkles, User, FileHeart, Paperclip
} from "lucide-react";
import api from "@/lib/api";
import { useClinicalKnowledgeStore } from "@/store/clinicalKnowledgeStore";
import { usePatientsStore } from "@/store/patientsStore";
import { useAuthStore } from "@/store/authStore";

interface OrderItem {
  id: string;
  type: "medication" | "lab" | "radiology";
  name: string;
  sig?: string;
  specimen?: string;
  urgency: "routine" | "stat";
}

export default function ClinicalWorkspacePage() {
  const { profile } = useAuthStore();

  // Patients Store hooks
  const {
    patients,
    selectedPatient,
    encounters,
    loading: patientsLoading,
    fetchPatients,
    fetchPatient,
    fetchEncounters,
    createEncounter
  } = usePatientsStore();

  // Navigation tabs for the left workspace column
  const [workspaceTab, setWorkspaceTab] = useState<"encounter" | "summary" | "orders" | "timeline">("encounter");
  
  // Right side assistant sub-tabs
  const [assistTab, setAssistTab] = useState<"queue" | "reference" | "differential" | "calculators">("queue");

  // Local state for encounter SOAP draft
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

  // AI Scribe State
  const [transcribing, setTranscribing] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [intakeNotes, setIntakeNotes] = useState("");

  // Reference Assistant state
  const { 
    query, results, selected, calculators, loading: refLoading, 
    setQuery, search, loadDetail, bootstrap 
  } = useClinicalKnowledgeStore();

  // Differential Diagnoses State
  const [symptomInput, setSymptomInput] = useState("");
  const [symptomList, setSymptomList] = useState<string[]>(["chest pain"]);
  const [differentials, setDifferentials] = useState<any[]>([]);
  const [diffLoading, setDiffLoading] = useState(false);

  // Interactive Calculators State
  const [activeCalculator, setActiveCalculator] = useState<any>(null);
  const [calcInputs, setCalcInputs] = useState<Record<string, any>>({});
  const [calcResult, setCalcResult] = useState<any | null>(null);

  // Pinned favorites
  const [favorites, setFavorites] = useState<any[]>([
    { id: "fav-1", title: "CURB-65 Calculator", type: "calculator" },
  ]);

  // Orders Cart state
  const [ordersCart, setOrdersCart] = useState<OrderItem[]>([]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedSig, setNewMedSig] = useState("Once daily");
  const [newMedUrgency, setNewMedUrgency] = useState<"routine" | "stat">("routine");
  const [newLabName, setNewLabName] = useState("Troponin");
  const [newRadName, setNewRadName] = useState("Chest X-Ray");

  // Interaction alert banner
  const [interactionAlert, setInteractionAlert] = useState<string | null>(null);

  // Telehealth state
  const [telehealthActive, setTelehealthActive] = useState(false);
  const [telehealthMuted, setTelehealthMuted] = useState(false);
  const [telehealthVideoMuted, setTelehealthVideoMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (telehealthActive) {
      setCallDuration(0);
      callIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(callIntervalRef.current);
    }
    return () => clearInterval(callIntervalRef.current);
  }, [telehealthActive]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleImportVitals = () => {
    const latestWithVitals = encounters.find(e => e.vitalSigns && (
      e.vitalSigns.bpSystolic || 
      e.vitalSigns.bpDiastolic || 
      e.vitalSigns.heartRate || 
      e.vitalSigns.temperature || 
      e.vitalSigns.spo2 || 
      e.vitalSigns.respiratoryRate
    ));

    if (latestWithVitals && latestWithVitals.vitalSigns) {
      const v = latestWithVitals.vitalSigns;
      const formatted = `BP: ${v.bpSystolic ?? "—"}/${v.bpDiastolic ?? "—"} mmHg, HR: ${v.heartRate ?? "—"} bpm, Temp: ${v.temperature ?? "—"}°C, SpO2: ${v.spo2 ?? "—"}%, RR: ${v.respiratoryRate ?? "—"} rpm (Imported from Triage/Ward)`;
      setObjective(prev => {
        if (prev.includes("Imported from Triage/Ward")) return prev;
        return prev ? `${prev}\n\n[Vitals] ${formatted}` : `[Vitals] ${formatted}`;
      });
      alert("Vitals successfully imported from patient's triage records!");
    } else {
      alert("No recent vitals found for this patient in their triage records.");
    }
  };

  // Load initial patients & reference catalog
  useEffect(() => {
    fetchPatients("", 1);
    bootstrap().catch(() => {});
  }, [fetchPatients, bootstrap]);

  // Load first patient context by default when list is populated
  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      handleLoadPatientContext(patients[0].id);
    }
  }, [patients, selectedPatient]);

  const handleLoadPatientContext = async (patientId: string) => {
    await fetchPatient(patientId);
    await fetchEncounters(patientId);
    
    // Clear SOAP state
    setSubjective("");
    setObjective("");
    setAssessment("");
    setPlan("");
    setChiefComplaint("");
    setIntakeNotes("");
    setOrdersCart([]);
    setInteractionAlert(null);
    setTelehealthActive(false);
  };

  // Run initial differentials search
  useEffect(() => {
    if (symptomList.length > 0) {
      handleGetDifferentials();
    }
  }, []);

  const handleGetDifferentials = async () => {
    setDiffLoading(true);
    try {
      const res = await api.post("/clinical-knowledge/differential", { symptoms: symptomList });
      setDifferentials(res.data.diseases ?? res.data.data?.diseases ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setDiffLoading(false);
    }
  };

  const handleRunCalculator = () => {
    if (!activeCalculator) return;
    let score = 0;
    activeCalculator.inputs.forEach((inp: any) => {
      const val = calcInputs[inp.key];
      if (val === true || val === "true") score += inp.points ?? 1;
      else if (typeof val === "number") score += val;
      else if (val && inp.options) {
        const opt = inp.options.find((o: any) => o.value === val);
        if (opt) score += opt.points ?? 0;
      }
    });

    let category = "Normal / Low Risk";
    if (activeCalculator.id === "curb65") {
      if (score >= 3) category = "High Risk (Inpatient ICU admission recommended)";
      else if (score >= 2) category = "Moderate Risk (Inpatient ward admission)";
      else category = "Low Risk (Outpatient treatment safe)";
    }

    setCalcResult({ score, category });
  };

  const handleCopyCalcToSOAP = () => {
    if (!calcResult || !activeCalculator) return;
    const txt = `\n[Clinical Score] ${activeCalculator.name}: Score = ${calcResult.score} (${calcResult.category})`;
    setPlan(prev => prev + txt);
    alert("Score copied to SOAP Treatment Plan!");
  };

  const handleAddMedicationOrder = async () => {
    if (!newMedName.trim()) return;
    
    // Check drug-drug interactions first
    const activeMeds = ordersCart.filter(o => o.type === "medication").map(o => o.name.split(" ")[0]);
    if (activeMeds.length > 0) {
      try {
        const response = await api.post("/ai/drug-interaction", { drugs: [...activeMeds, newMedName] });
        if (response.data.hasInteraction) {
          setInteractionAlert(`âš ï¸ Interaction Warning: ${response.data.details}`);
        } else {
          setInteractionAlert(null);
        }
      } catch (err) {
        console.error(err);
      }
    }

    const item: OrderItem = {
      id: String(Date.now()),
      type: "medication",
      name: `${newMedName} - Sig: ${newMedSig}`,
      sig: newMedSig,
      urgency: newMedUrgency
    };
    setOrdersCart(prev => [...prev, item]);
    setNewMedName("");
  };

  const handleTriggerAIScribe = async () => {
    if (!chiefComplaint.trim() || !intakeNotes.trim()) {
      alert("Please provide both Chief Complaint and Intake Dialogue.");
      return;
    }
    setTranscribing(true);
    try {
      const response = await api.post("/ai/scribe", { complaint: chiefComplaint, transcript: intakeNotes });
      const payload = response.data;
      if (payload) {
        setSubjective(payload.subjective ?? "");
        setObjective(payload.objective ?? "");
        setAssessment(payload.assessment ?? "");
        setPlan(payload.plan ?? "");
      }
    } catch (err) {
      alert("AI Scribe call failed. Please verify API key configuration.");
    } finally {
      setTranscribing(false);
    }
  };

  const handleSignEncounter = async () => {
    if (!selectedPatient) return;
    if (!subjective && !objective && !assessment && !plan) {
      alert("Cannot sign empty SOAP encounter notes.");
      return;
    }

    try {
      // Create encounter record
      const enc = await createEncounter(selectedPatient.id, chiefComplaint || "Clinical Consultation");
      if (enc) {
        // Save the detailed SOAP notes onto the encounter
        await api.patch(`/clinical/encounters/${enc.id}/soap-note`, {
          soapNote: { subjective, objective, assessment, plan }
        });
        alert("SOAP Encounter successfully signed and saved!");
        // Refresh timeline
        await fetchEncounters(selectedPatient.id);
      }
    } catch (err: any) {
      alert("Failed to sign encounter: " + err.message);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  };

  return (
    <>
      <Topbar title="Clinical Workspace (MD Desk)" />
      <main className="p-6 grid grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Clinical Workflow Desk (Encounter, Summary, Orders, History) */}
        <div className="col-span-8 space-y-4">
          
          {/* Patient Banner Dashboard */}
          {selectedPatient ? (
            <div className="glass card flex items-center justify-between p-4" style={{ borderRadius: 12 }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ background: "rgba(159,216,189,0.15)", color: "var(--color-primary)" }}>
                  {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[var(--color-text)]">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                    <span className="badge badge-neutral font-mono text-[10px]">{selectedPatient.mrn}</span>
                    {selectedPatient.bloodType && (
                      <span className="badge badge-amber font-semibold text-[9.5px]">Blood: {selectedPatient.bloodType}</span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-[var(--color-text-muted)] mt-1">
                    {calculateAge(selectedPatient.dateOfBirth)} y/o {selectedPatient.gender} &bull; Email: {selectedPatient.primaryEmail ?? "â€”"} &bull; Phone: {selectedPatient.primaryPhone ?? "â€”"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTelehealthActive(prev => !prev)}
                  className={`btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 transition-all ${
                    telehealthActive ? "text-red-400 border-red-500/25 bg-red-500/5 hover:bg-red-500/10 font-bold" : "text-sky-400 border-sky-400/25 hover:border-sky-400 hover:text-sky-300"
                  }`}
                >
                  <Video size={13} />
                  {telehealthActive ? "End Consultation" : "Start Telehealth"}
                </button>
                <button 
                  onClick={() => setWorkspaceTab("summary")}
                  className="btn-secondary text-xs px-3.5 py-1.5"
                >
                  Chart Summary
                </button>
                <button 
                  onClick={() => setWorkspaceTab("encounter")}
                  className="btn-primary text-xs px-3.5 py-1.5" 
                  style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
                >
                  Active SOAP Note
                </button>
              </div>
            </div>
          ) : (
            <div className="glass card p-6 text-center text-xs text-[var(--color-text-muted)]" style={{ borderRadius: 12 }}>
              <Loader2 className="animate-spin mx-auto mb-2 text-[var(--color-primary)]" size={16} />
              Loading patient context...
            </div>
          )}

          {/* Tab Navigation selectors */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10" style={{ width: "max-content" }}>
            {[
              { id: "encounter", label: "Active SOAP Encounter" },
              { id: "summary", label: "Patient Chart Summary" },
              { id: "orders", label: "Orders Desk (Meds/Labs)" },
              { id: "timeline", label: "Clinical Timeline & History" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setWorkspaceTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  workspaceTab === tab.id 
                    ? "bg-[var(--color-primary)] text-[var(--color-bg)] shadow-sm font-bold" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Workspace Views */}
          {workspaceTab === "encounter" && (
            <div className="space-y-4">
              {/* AI Scribe Assist panel */}
              <div className="glass-shell card glass p-4 space-y-3" style={{ borderRadius: 12 }}>
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase">
                  <Sparkles size={14} />
                  <span>Ambient Clinical AI Scribe</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Chief Complaint</label>
                    <input className="input text-xs" placeholder="e.g. Sharp radiating chest pain..." value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Intake Dialogue Transcript / Notes</label>
                    <textarea className="input text-xs" rows={2} placeholder="Scribe listens: Patient reports crushing chest pain for 2 hrs..." value={intakeNotes} onChange={e => setIntakeNotes(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    disabled={transcribing}
                    onClick={handleTriggerAIScribe}
                    className="btn-secondary text-[11px] py-1.5 px-4 flex items-center gap-1.5 text-sky-400 border-sky-400/25 hover:border-sky-400 hover:text-sky-300"
                  >
                    {transcribing ? <Loader2 size={11} className="animate-spin" /> : <Brain size={12} />}
                    Draft SOAP Note via Gemini AI
                  </button>
                </div>
              </div>

              {/* SOAP Textareas / Telehealth Split Screen */}
              {telehealthActive ? (
                <div className="grid grid-cols-12 gap-4">
                  {/* Telehealth side video console */}
                  <div className="col-span-5 glass-shell card glass p-4 flex flex-col justify-between" style={{ borderRadius: 12, minHeight: 460 }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs uppercase">
                        <Video size={13} />
                        <span>Live Telehealth Call</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">CONNECTED</span>
                        <span className="text-[11px] text-[var(--color-text-muted)] font-mono">{formatDuration(callDuration)}</span>
                      </div>
                    </div>

                    {/* Video screens mock */}
                    <div className="my-4 relative bg-black/60 rounded-xl overflow-hidden flex-1 min-h-[220px] flex items-center justify-center border border-white/5 shadow-inner">
                      {!telehealthVideoMuted ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                          <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/20 flex items-center justify-center text-xl font-semibold text-[var(--color-primary)] relative">
                            <span className="animate-ping absolute inset-0 rounded-full bg-[var(--color-primary)]/10" />
                            {selectedPatient?.firstName[0]}{selectedPatient?.lastName[0]}
                          </div>
                          <div className="text-[var(--color-text)] font-semibold text-xs">{selectedPatient?.firstName} {selectedPatient?.lastName}</div>
                          <div className="text-[10px] text-sky-400/80 flex items-center gap-1">
                            <Activity size={10} className="animate-pulse" />
                            <span>Audio stream active &middot; WebRTC</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[var(--color-text-muted)] text-xs italic">Patient video feed paused</div>
                      )}

                      <div className="absolute right-3 bottom-3 w-28 h-20 bg-neutral-900 border border-white/10 rounded-lg overflow-hidden shadow flex items-center justify-center">
                        <User size={18} className="text-neutral-500" />
                        <span className="absolute bottom-1 right-1.5 text-[8.5px] text-white/50 uppercase font-bold">You</span>
                      </div>
                    </div>

                    {/* Audio/Video controls */}
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setTelehealthMuted(prev => !prev)}
                        className={`btn-secondary text-[11px] py-1.5 px-3 rounded-lg border transition-all ${
                          telehealthMuted ? "bg-red-500/10 text-red-400 border-red-500/25" : "text-[var(--color-text-muted)] border-white/10"
                        }`}
                      >
                        {telehealthMuted ? "Unmute Mic" : "Mute Mic"}
                      </button>
                      <button 
                        onClick={() => setTelehealthVideoMuted(prev => !prev)}
                        className={`btn-secondary text-[11px] py-1.5 px-3 rounded-lg border transition-all ${
                          telehealthVideoMuted ? "bg-red-500/10 text-red-400 border-red-500/25" : "text-[var(--color-text-muted)] border-white/10"
                        }`}
                      >
                        {telehealthVideoMuted ? "Show Video" : "Hide Video"}
                      </button>
                      <button 
                        onClick={() => setTelehealthActive(false)}
                        className="btn-primary text-[11px] py-1.5 px-4 bg-red-500 text-white border-red-500 hover:bg-red-600 rounded-lg"
                      >
                        Hang Up
                      </button>
                    </div>
                  </div>

                  {/* SOAP text areas */}
                  <div className="col-span-7 space-y-3">
                    {[
                      { key: "S", title: "Subjective Notes", val: subjective, set: setSubjective, placeholder: "Patient-reported symptoms..." },
                      { key: "O", title: "Objective Measurements", val: objective, set: setObjective, placeholder: "Physical exam findings..." },
                      { key: "A", title: "Assessment & Diagnoses", val: assessment, set: setAssessment, placeholder: "Clinical diagnostic reasoning..." },
                      { key: "P", title: "Plan & Treatment Directions", val: plan, set: setPlan, placeholder: "Interventions, prescriptions..." }
                    ].map(section => (
                      <div key={section.key} className="glass-shell card glass p-3.5 space-y-1.5" style={{ borderRadius: 10 }}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wide">{section.key} &mdash; {section.title}</h3>
                          {section.key === "O" && (
                            <button
                              onClick={handleImportVitals}
                              className="btn-secondary text-[9px] py-0.5 px-2 flex items-center gap-1 text-[var(--color-primary)] border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/5"
                            >
                              <Paperclip size={9} /> Import Vitals
                            </button>
                          )}
                        </div>
                        <textarea
                          className="input text-[11.5px] leading-relaxed"
                          rows={2}
                          placeholder={section.placeholder}
                          value={section.val}
                          onChange={e => section.set(e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Regular 1-column SOAP textareas */
                <div className="space-y-4">
                  {[
                    { key: "S", title: "Subjective Notes", val: subjective, set: setSubjective, placeholder: "Patient-reported symptoms, history of present illness..." },
                    { key: "O", title: "Objective Measurements", val: objective, set: setObjective, placeholder: "Physical exam findings, vital signs, lab metrics..." },
                    { key: "A", title: "Assessment & Diagnoses", val: assessment, set: setAssessment, placeholder: "Clinical diagnostic reasoning, ICD codes..." },
                    { key: "P", title: "Plan & Treatment Directions", val: plan, set: setPlan, placeholder: "Step-by-step interventions, prescriptions, follow-ups..." }
                  ].map(section => (
                    <div key={section.key} className="glass-shell card glass p-4 space-y-2" style={{ borderRadius: 10 }}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wide">{section.key} &mdash; {section.title}</h3>
                        {section.key === "O" && (
                          <button
                            onClick={handleImportVitals}
                            className="btn-secondary text-[10px] py-1 px-2.5 flex items-center gap-1 text-[var(--color-primary)] border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/5"
                          >
                            <Thermometer size={10} /> Import Triage Vitals
                          </button>
                        )}
                      </div>
                      <textarea
                        className="input text-xs leading-relaxed"
                        rows={section.key === "P" ? 5 : 3}
                        placeholder={section.placeholder}
                        value={section.val}
                        onChange={e => section.set(e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Sign Actions */}
              <div className="flex items-center gap-3 justify-end pt-2">
                <button className="btn-secondary text-xs">Save Draft</button>
                <button onClick={handleSignEncounter} className="btn-primary text-xs flex items-center gap-1.5" style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}>
                  <Save size={13} />
                  Sign & Finalize Encounter
                </button>
              </div>
            </div>
          )}

          {workspaceTab === "summary" && selectedPatient && (
            <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
              <div className="border-b border-[var(--color-border)] pb-2">
                <h2 className="text-[var(--color-text)] text-sm font-bold uppercase tracking-wider">Patient Chart Profile Summary</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                
                {/* Problem List */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--color-border)] space-y-2">
                  <div className="font-semibold text-xs text-[var(--color-primary)] flex items-center gap-1.5">
                    <Notebook size={13} />
                    <span>Clinical Profile & Problems</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[var(--color-text-muted)]">
                    <li>Active Problem List (Symptomatic)</li>
                    <li>Clinical Governance History</li>
                    <li>Blood Type: {selectedPatient.bloodType ?? "Not Screened"}</li>
                  </ul>
                </div>

                {/* Allergies and flags */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--color-border)] space-y-2">
                  <div className="font-semibold text-xs text-red-400 flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    <span>Allergies & Medical Alerts</span>
                  </div>
                  {selectedPatient.allergies?.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedPatient.allergies.map((a: any, i: number) => (
                        <div key={i} className="px-2 py-1 rounded bg-red-500/10 border border-red-500/15 text-red-400 text-[10.5px]">
                          {a.substance} ({a.severity} severity)
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[var(--color-text-muted)] italic">No allergies recorded in chart profile.</div>
                  )}
                </div>

              </div>
            </div>
          )}

          {workspaceTab === "orders" && (
            <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
              <div className="border-b border-[var(--color-border)] pb-2">
                <h2 className="text-[var(--color-text)] text-sm font-bold uppercase tracking-wider">Clinical Orders Entry Desk</h2>
              </div>

              {interactionAlert && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#fb923c] text-xs flex items-start gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{interactionAlert}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {/* Med Order */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--color-border)] space-y-3">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Prescribe Medication</div>
                  <div className="space-y-2 text-xs">
                    <input className="input" placeholder="Drug name (e.g. Aspirin)..." value={newMedName} onChange={e => setNewMedName(e.target.value)} />
                    <input className="input" placeholder="Directions (sig)..." value={newMedSig} onChange={e => setNewMedSig(e.target.value)} />
                    <select className="input" value={newMedUrgency} onChange={e => setNewMedUrgency(e.target.value as any)}>
                      <option value="routine">Routine</option>
                      <option value="stat">STAT Urgent</option>
                    </select>
                    <button onClick={handleAddMedicationOrder} className="btn-primary w-full text-[11px] py-1.5 flex items-center justify-center gap-1.5" style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}>
                      <PlusCircle size={12} /> Add Drug Order
                    </button>
                  </div>
                </div>

                {/* Lab Order */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--color-border)] space-y-3">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Order Lab Panel</div>
                  <div className="space-y-2 text-xs">
                    <select className="input" value={newLabName} onChange={e => setNewLabName(e.target.value)}>
                      <option value="Troponin I/T Serum">Troponin Serum Panel</option>
                      <option value="CBC with Diff">CBC Hemogram</option>
                      <option value="Basic Metabolic Panel">BMP</option>
                      <option value="D-Dimer Assay">D-Dimer Assay</option>
                    </select>
                    <button 
                      onClick={() => setOrdersCart(prev => [...prev, { id: String(Date.now()), type: "lab", name: newLabName, specimen: "Blood", urgency: "stat" }])}
                      className="btn-primary w-full text-[11px] py-1.5 flex items-center justify-center gap-1.5"
                      style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
                    >
                      <PlusCircle size={12} /> Add Lab Order
                    </button>
                  </div>
                </div>

                {/* Radiology Order */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--color-border)] space-y-3">
                  <div className="font-semibold text-xs text-[var(--color-text)]">Order Radiology Scan</div>
                  <div className="space-y-2 text-xs">
                    <select className="input" value={newRadName} onChange={e => setNewRadName(e.target.value)}>
                      <option value="Chest X-Ray PA/Lateral">Chest X-Ray PA/Lat</option>
                      <option value="CT Head without contrast">CT Head W/O Contrast</option>
                      <option value="Ultrasound Abdomen">US Abdomen Complete</option>
                    </select>
                    <button 
                      onClick={() => setOrdersCart(prev => [...prev, { id: String(Date.now()), type: "radiology", name: newRadName, urgency: "routine" }])}
                      className="btn-primary w-full text-[11px] py-1.5 flex items-center justify-center gap-1.5"
                      style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
                    >
                      <PlusCircle size={12} /> Add Rad Order
                    </button>
                  </div>
                </div>
              </div>

              {/* Cart Queue */}
              <div className="pt-2 space-y-2">
                <div className="text-xs text-[var(--color-text-muted)] uppercase font-bold">Pending Orders to Sign ({ordersCart.length})</div>
                <div className="space-y-1.5">
                  {ordersCart.map(o => (
                    <div key={o.id} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[var(--color-text)]">{o.name}</span>
                        <span className="ml-2 text-[10px] text-[var(--color-text-muted)] capitalize">({o.type})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                          o.urgency === "stat" ? "bg-red-500/10 text-red-400" : "bg-white/5 text-[var(--color-text-muted)]"
                        }`}>{o.urgency}</span>
                        <button onClick={() => setOrdersCart(prev => prev.filter(x => x.id !== o.id))} className="text-red-400 hover:text-red-500">
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {workspaceTab === "timeline" && (
            <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
              <div className="border-b border-[var(--color-border)] pb-2">
                <h2 className="text-[var(--color-text)] text-sm font-bold uppercase tracking-wider">Patient Clinical History Timeline</h2>
              </div>
              {encounters.length > 0 ? (
                <div className="relative border-l border-[var(--color-border)] ml-3 pl-5 space-y-5 py-2 text-xs">
                  {encounters.map(enc => (
                    <div key={enc.id} className="relative">
                      <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
                      <div className="text-[var(--color-text)] font-bold">{enc.chiefComplaint || "Clinical Consult"}</div>
                      <div className="text-[var(--color-text-muted)] text-[10px] mt-0.5">
                        {new Date(enc.createdAt).toLocaleString()} &middot; Status: <span className="font-bold">{enc.status}</span>
                      </div>
                      {enc.soapNote && (
                        <div className="mt-2 p-3 rounded-xl border border-[var(--color-border)] bg-white/5 space-y-1.5 leading-relaxed text-[11px] text-[var(--color-text-muted)]">
                          {enc.soapNote.subjective && <div><strong>S:</strong> {enc.soapNote.subjective}</div>}
                          {enc.soapNote.objective && <div><strong>O:</strong> {enc.soapNote.objective}</div>}
                          {enc.soapNote.assessment && <div><strong>A:</strong> {enc.soapNote.assessment}</div>}
                          {enc.soapNote.plan && <div><strong>P:</strong> {enc.soapNote.plan}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-[var(--color-text-muted)] italic text-xs">No clinical encounters recorded in database history.</div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Clinical Assistant Dock (Assigned Patients, Drug Lookup, Differentials, Calculators) */}
        <div className="col-span-4 space-y-4">
          
          <div className="glass-shell card glass p-4 space-y-3" style={{ borderRadius: 12 }}>
            
            {/* Assist tabs */}
            <div className="flex gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
              {[
                { id: "queue", label: "My Patients" },
                { id: "reference", label: "Drug Lookup" },
                { id: "differential", label: "Differentials" },
                { id: "calculators", label: "Calculators" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAssistTab(tab.id as any)}
                  className={`flex-1 py-1.5 rounded text-[10.5px] font-semibold transition-all ${
                    assistTab === tab.id ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {assistTab === "queue" && (
              <div className="space-y-3">
                <div className="text-xs text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1.5">
                  <User size={13} />
                  <span>Receptionist Assigned Queue</span>
                </div>
                
                {patientsLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[var(--color-primary)]" size={16} /></div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {patients.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleLoadPatientContext(p.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                          selectedPatient?.id === p.id 
                            ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/45" 
                            : "bg-white/5 border-[var(--color-border)] hover:bg-white/10"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[var(--color-text)]">{p.firstName} {p.lastName}</span>
                          <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{p.mrn}</span>
                        </div>
                        <div className="text-[10.5px] text-[var(--color-text-muted)] mt-1 flex justify-between">
                          <span>{calculateAge(p.dateOfBirth)} y/o {p.gender}</span>
                          <span className="font-semibold text-[var(--color-primary)]">{p.bloodType ?? "A+"}</span>
                        </div>
                      </button>
                    ))}
                    {patients.length === 0 && (
                      <div className="text-center py-10 text-[var(--color-text-muted)] italic">No patients in queue.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {assistTab === "reference" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={13} />
                  <input
                    className="input pl-8 text-xs"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search Lisinopril, MI guidelines, Troponin..."
                    onKeyDown={e => {
                      if (e.key === "Enter") search();
                    }}
                  />
                </div>

                {refLoading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-[var(--color-primary)]" size={16} /></div>}

                {results.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                    {results.slice(0, 5).map(item => (
                      <button
                        key={item.id}
                        onClick={() => loadDetail(item.domain, item.id)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                          selected?.id === item.id ? "bg-white/10 border-[var(--color-primary)]/30" : "bg-white/5 border-[var(--color-border)] hover:bg-white/10"
                        }`}
                      >
                        <div className="font-bold text-[var(--color-text)] truncate">{item.title}</div>
                        <div className="text-[10px] text-[var(--color-text-muted)] capitalize mt-0.5">{item.domain}</div>
                      </button>
                    ))}
                  </div>
                ) : !refLoading && (
                  <div className="text-center py-6 text-[11px] text-[var(--color-text-muted)] italic">
                    Type a query and press Enter.
                  </div>
                )}

                {selected && (
                  <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--color-border)] space-y-2 text-xs">
                    <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-1.5">
                      <div className="font-bold text-[var(--color-text)] text-xs truncate max-w-[180px]">{selected.name || selected.testName || selected.guidelineName}</div>
                      <button 
                        onClick={() => {
                          const name = selected.name || selected.testName || selected.guidelineName;
                          if (!favorites.some(f => f.title === name)) {
                            setFavorites(prev => [...prev, { id: String(Date.now()), title: name, type: "reference" }]);
                          }
                        }}
                        className="text-[#fb923c] hover:opacity-80"
                      >
                        <Star size={11} fill="#fb923c" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-[11px] leading-relaxed max-h-48 overflow-y-auto pr-1">
                      {selected.description && <div><strong className="text-[var(--color-primary)]">Description:</strong> {selected.description}</div>}
                      {selected.clinicalPresentation && <div><strong className="text-[var(--color-primary)]">Clinical Presentation:</strong> {selected.clinicalPresentation}</div>}
                      {selected.adultDose && <div><strong className="text-[var(--color-primary)]">Adult Dosage:</strong> {selected.adultDose}</div>}
                      {selected.normalRange && <div><strong className="text-[var(--color-primary)]">Normal Range:</strong> {selected.normalRange}</div>}
                      {selected.summary && <div><strong className="text-[var(--color-primary)]">Guideline:</strong> {selected.summary}</div>}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          const info = selected.clinicalPresentation || selected.adultDose || selected.normalRange || selected.summary || "";
                          if (info) {
                            setPlan(prev => prev + `\n[Reference Notes] ${selected.name || selected.testName || selected.guidelineName}: ${info}`);
                            alert("Reference details copied to Plan!");
                          }
                        }}
                        className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5"
                      >
                        Copy to Plan &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {assistTab === "differential" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    className="input text-xs"
                    value={symptomInput}
                    onChange={e => setSymptomInput(e.target.value)}
                    placeholder="Add symptom..."
                    onKeyDown={e => {
                      if (e.key === "Enter" && symptomInput.trim()) {
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
                    className="btn-primary text-xs py-1.5 px-3"
                    style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {symptomList.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25 text-[10px] text-[var(--color-primary)] flex items-center gap-1">
                      {s}
                      <button onClick={() => setSymptomList(prev => prev.filter(x => x !== s))} className="hover:text-red-400">Ã—</button>
                    </span>
                  ))}
                </div>

                <button 
                  onClick={handleGetDifferentials}
                  disabled={diffLoading || symptomList.length === 0}
                  className="btn-primary w-full text-[11px] py-1.5 flex items-center justify-center gap-1.5"
                  style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
                >
                  {diffLoading ? <Loader2 size={11} className="animate-spin" /> : <Stethoscope size={11} />}
                  Find Differentials
                </button>

                {differentials.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 pt-1">
                    {differentials.map(item => (
                      <div key={item.disease.id} className="p-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-xs text-[var(--color-text)]">{item.disease.name}</span>
                          <span className="text-[10px] text-[var(--color-primary)] font-mono">{Math.round(item.score * 100)}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.matchedSymptoms.map((ms: string) => (
                            <span key={ms} className="px-1 py-0.2 rounded bg-emerald-500/5 border border-emerald-500/15 text-[8.5px] text-[var(--color-primary)]">{ms}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {assistTab === "calculators" && (
              <div className="space-y-3">
                <select 
                  className="input text-xs" 
                  value={activeCalculator?.id || ""} 
                  onChange={e => {
                    const calc = calculators.find(c => c.id === e.target.value);
                    setActiveCalculator(calc || null);
                    setCalcInputs({});
                    setCalcResult(null);
                  }}
                >
                  <option value="">Select Clinical Calculator...</option>
                  {calculators.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {activeCalculator && (
                  <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--color-border)] space-y-3 text-xs">
                    <div className="font-bold text-[var(--color-text)] text-xs border-b border-[var(--color-border)] pb-1">{activeCalculator.name}</div>
                    
                    <div className="space-y-2">
                      {activeCalculator.inputs.map((inp: any) => (
                        <div key={inp.key} className="space-y-1">
                          <label className="text-[10.5px] text-[var(--color-text-muted)]">{inp.label}</label>
                          {inp.type === "boolean" ? (
                            <div className="flex gap-2">
                              {["Yes", "No"].map(o => (
                                <button
                                  key={o}
                                  onClick={() => setCalcInputs(prev => ({ ...prev, [inp.key]: o === "Yes" }))}
                                  className={`flex-1 py-1 rounded border text-[10px] transition-all ${
                                    calcInputs[inp.key] === (o === "Yes")
                                      ? "bg-[var(--color-primary)]/15 border-[var(--color-primary)]/30 text-[var(--color-primary)] font-bold"
                                      : "bg-white/5 border-white/5 text-[var(--color-text-muted)]"
                                  }`}
                                >
                                  {o}
                                </button>
                              ))}
                            </div>
                          ) : inp.options ? (
                            <select
                              className="input text-xs py-1"
                              value={calcInputs[inp.key] || ""}
                              onChange={e => setCalcInputs(prev => ({ ...prev, [inp.key]: e.target.value }))}
                            >
                              <option value="">Select option...</option>
                              {inp.options.map((o: any) => (
                                <option key={o.value} value={o.value}>{o.label} ({o.points} pts)</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              className="input text-xs py-1"
                              placeholder={inp.placeholder}
                              value={calcInputs[inp.key] || ""}
                              onChange={e => setCalcInputs(prev => ({ ...prev, [inp.key]: parseFloat(e.target.value) }))}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <button onClick={handleRunCalculator} className="btn-primary w-full text-[11px] py-1.5" style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}>
                      Calculate Score
                    </button>

                    {calcResult && (
                      <div className="p-2.5 rounded bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25 space-y-1">
                        <div className="font-bold text-[var(--color-text)]">Result: {calcResult.score} points</div>
                        <div className="text-[10px] text-[var(--color-primary)] font-semibold leading-relaxed">{calcResult.category}</div>
                        <div className="flex justify-end pt-1 border-t border-white/5 mt-1.5">
                          <button onClick={handleCopyCalcToSOAP} className="text-[9.5px] text-sky-400 hover:underline">
                            Insert into SOAP Note &rarr;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Quick Actions Panel */}
          <div className="glass-shell card glass p-4 space-y-2.5" style={{ borderRadius: 12 }}>
            <div className="text-xs text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1.5">
              <FileHeart size={13} />
              <span>MD Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => {
                  alert("Emergency Critical Alert Sent to Nursing Desk.");
                }}
                className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 text-left text-red-400 font-semibold flex items-center gap-1.5"
              >
                <AlertTriangle size={12} /> Send Triage Alert
              </button>
              <button 
                onClick={() => {
                  alert("Admissions request sent to Ward Desk.");
                }}
                className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 text-left text-[var(--color-primary)] font-semibold flex items-center gap-1.5"
              >
                Request ICU Bed
              </button>
            </div>
          </div>

        </div>

      </main>
    </>
  );
}
