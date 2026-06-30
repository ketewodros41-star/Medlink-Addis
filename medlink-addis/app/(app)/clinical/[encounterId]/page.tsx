"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Brain, Save, Loader2, CheckCircle, ChevronLeft, ChevronRight,
  Heart, Activity, Thermometer, Wind, Stethoscope, AlertTriangle, Wand2, BookOpen
} from "lucide-react";


import Topbar from "@/components/Topbar";
import api from "@/lib/api";
import { useAiStore } from "@/store/aiStore";

interface VitalSigns {
  bpSystolic?: number; bpDiastolic?: number;
  heartRate?: number; temperature?: number; spo2?: number; respiratoryRate?: number;
}

interface SoapNote {
  subjective?: string; objective?: string; assessment?: string; plan?: string;
}

interface Encounter {
  id: string; patientId: string; chiefComplaint: string | null;
  status: string; vitalSigns: VitalSigns | null; soapNote: SoapNote | null;
  createdAt: string; hospitalId: string;
}

interface Patient {
  id: string; firstName: string; lastName: string; mrn: string;
  gender: string; dateOfBirth: string; bloodType: string | null;
  allergies: Array<{ substance: string; severity: string }>;
}

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function EncounterPage() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const router = useRouter();

  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [vitals, setVitals] = useState<VitalSigns>({});

  // AI Scribe State
  const [transcript, setTranscript] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const { generateSoap } = useAiStore();

  // Clinical Reference Assist State
  const [refAssist, setRefAssist] = useState<{
    diseases: any[];
    medications: any[];
    labs: any[];
    calculators: any[];
    cases: any[];
  } | null>(null);

  const [assistTab, setAssistTab] = useState<"reference" | "calculators" | "cases">("reference");
  const [activeCalcId, setActiveCalcId] = useState<string | null>(null);
  const [calcInputs, setCalcInputs] = useState<Record<string, number | boolean | string>>({});
  const [calcResult, setCalcResult] = useState<any | null>(null);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus("Copied!");
    setTimeout(() => setCopiedStatus(null), 1500);
  };


  useEffect(() => {
    const text = (soap.subjective || encounter?.chiefComplaint || "").trim();
    if (text.length < 3) {
      setRefAssist(null);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      // Find keywords in subjective or chief complaint
      api.get(`/clinical-knowledge/assist?query=${encodeURIComponent(text.slice(-40))}`)
        .then(res => {
          const payload = res.data.data ?? res.data;
          setRefAssist(payload);
        })
        .catch(() => {});
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [soap.subjective, encounter?.chiefComplaint]);


  useEffect(() => {
    if (!encounterId) return;
    setLoading(true);
    api.get(`/clinical/encounters/${encounterId}`)

      .then(async (res) => {
        const enc: Encounter = res.data.data;
        setEncounter(enc);
        setSoap({
          subjective: enc.soapNote?.subjective ?? "",
          objective: enc.soapNote?.objective ?? "",
          assessment: enc.soapNote?.assessment ?? "",
          plan: enc.soapNote?.plan ?? "",
        });
        setVitals(enc.vitalSigns ?? {});
        // Fetch patient
        const pr = await api.get(`/patients/${enc.patientId}`);
        setPatient(pr.data.data);
      })
      .catch((e) => setError(e.response?.data?.error?.message ?? e.message))
      .finally(() => setLoading(false));
  }, [encounterId]);

  const handleSave = useCallback(async (currentSoap = soap) => {
    setSaving(true);
    setSaved(false);
    try {
      // Save SOAP note
      await api.patch(`/clinical/encounters/${encounterId}/soap-note`, currentSoap);
      // Save vitals if any filled
      const hasVitals = Object.values(vitals).some((v) => v !== undefined && v !== null && v !== 0);
      if (hasVitals) await api.post(`/clinical/encounters/${encounterId}/vitals`, vitals);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.response?.data?.error?.message ?? e.message);
    } finally {
      setSaving(false);
    }
  }, [encounterId, soap, vitals]);

  const handleSign = useCallback(async () => {
    setSigning(true);
    try {
      await handleSave();
      await api.patch(`/clinical/encounters/${encounterId}/sign`, {});
      setEncounter((prev) => prev ? { ...prev, status: "Signed" } : prev);
    } catch (e: any) {
      setError(e.response?.data?.error?.message ?? e.message);
    } finally {
      setSigning(false);
    }
  }, [encounterId, handleSave]);

  const handleAiScribe = async () => {
    if (!transcript.trim()) return;
    setAiLoading(true);
    setError(null);
    try {
      const response = await generateSoap(encounter?.chiefComplaint || "Encounter Intake", transcript.trim());
      if (response) {
        const newSoap = {
          subjective: response.subjective || "",
          objective: response.objective || "",
          assessment: response.assessment || "",
          plan: response.plan || "",
        };
        setSoap(newSoap);
        // Save immediately
        await handleSave(newSoap);
      } else {
        setError("AI Scribe failed to generate structured note.");
      }
    } catch (e: any) {
      setError("AI generation failed. Please check Gemini API key configuration.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return (
    <><Topbar title="Clinical Encounter" />
      <main className="p-6 flex items-center justify-center" style={{ minHeight: 400 }}>
        <Loader2 className="animate-spin text-[#9fd8bd]" size={32} />
      </main>
    </>
  );

  if (error && !encounter) return (
    <><Topbar title="Clinical Encounter" />
      <main className="p-6"><div className="text-red-400 text-sm">{error}</div></main>
    </>
  );

  const signed = encounter?.status === "Signed";

  return (
    <>
      <Topbar title="Clinical Encounter" />
      <main className="p-6">
        {/* Back */}
        {patient && (
          <button onClick={() => router.push(`/patients/${patient.id}`)} className="flex items-center gap-2 btn-ghost mb-4" style={{ fontSize: 13 }}>
            <ChevronLeft size={14} /> Back to Patient Chart
          </button>
        )}

        {/* Patient banner */}
        {patient && (
          <div className="glass card flex items-center justify-between mb-5" style={{ borderRadius: 10 }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ background: "rgba(159,216,189,0.15)", color: "#9fd8bd" }}>
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#eeeae0" }}>{patient.firstName} {patient.lastName}</div>
                <div style={{ fontSize: 12, color: "#93a096" }}>
                  {patient.mrn} &middot; {age(patient.dateOfBirth)} y/o {patient.gender}
                  {patient.bloodType && <> &middot; <span style={{ color: "#f87171" }}>Blood: {patient.bloodType}</span></>}
                  {patient.allergies.length > 0 && <> &middot; <span style={{ color: "#fb923c" }}>Allergies: {patient.allergies.map(a => a.substance).join(", ")}</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${signed ? "badge-green" : "badge-amber"}`}>{encounter?.status}</span>
              {encounter?.chiefComplaint && (
                <span style={{ fontSize: 12, color: "#93a096", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  CC: {encounter.chiefComplaint}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-5">
          {/* SOAP Editor */}
          <div className="col-span-2 space-y-4">
            
            {/* AI Scribe Section */}
            {!signed && (
              <div className="glass-shell card glass p-4" style={{ borderRadius: 10, border: "1px solid rgba(163,209,223,0.15)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={16} style={{ color: "#a3d1df" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#eeeae0" }}>AI Medical Scribe (Gemini Studio)</span>
                </div>
                <p style={{ fontSize: 11.5, color: "#93a096", marginBottom: 12 }}>
                  Enter raw clinical logs, dictation notes, or conversation transcript below to generate a formatted SOAP note.
                </p>
                <textarea
                  className="input mb-3"
                  rows={3}
                  placeholder="e.g. Patient presents with acute sore throat and dry cough for 3 days. Denies shortness of breath. Checked throat, saw erythematous pharynx. Recommended paracetamol and warm salt water..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  style={{ fontSize: 12.5 }}
                />
                <button
                  className="btn-primary flex items-center gap-1.5"
                  style={{ fontSize: 12, padding: "8px 16px" }}
                  disabled={aiLoading || !transcript.trim()}
                  onClick={handleAiScribe}
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                  Auto-Structure into SOAP
                </button>
              </div>
            )}

            {/* SOAP sections */}
            {(["subjective", "objective", "assessment", "plan"] as const).map((section, i) => (
              <div key={section} className="glass-shell card glass" style={{ borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9fd8bd", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  {section[0].toUpperCase()} &mdash; {section.charAt(0).toUpperCase() + section.slice(1)}
                </div>
                <textarea
                  className="input"
                  rows={i === 3 ? 5 : 3}
                  style={{ resize: "vertical" }}
                  disabled={signed}
                  placeholder={[
                    "Patient's reported symptoms, history of present illness...",
                    "Physical examination findings, vital signs, lab values...",
                    "Diagnoses, ICD-10 codes, clinical reasoning...",
                    "Treatment plan, medications, follow-up instructions...",
                  ][i]}
                  value={soap[section]}
                  onChange={(e) => setSoap((s) => ({ ...s, [section]: e.target.value }))}
                />
              </div>
            ))}

            {error && <div className="text-red-400 text-xs">{error}</div>}

            {!signed && (
              <div className="flex items-center gap-3 justify-end">
                <button className="btn-secondary flex items-center gap-2" style={{ fontSize: 13 }} disabled={saving} onClick={() => handleSave(soap)}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle size={13} style={{ color: "#9fd8bd" }} /> : <Save size={13} />}
                  {saved ? "Saved!" : "Save Draft"}
                </button>
                <button className="btn-primary flex items-center gap-2" style={{ fontSize: 13 }} disabled={signing} onClick={handleSign}>
                  {signing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  Sign & Submit
                </button>
              </div>
            )}
            {signed && (
              <div className="flex items-center gap-2 justify-end" style={{ color: "#9fd8bd", fontSize: 13 }}>
                <CheckCircle size={14} /> Encounter signed — read only
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Vitals entry */}
            <div className="glass-shell card glass" style={{ borderRadius: 12 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: "#eeeae0", marginBottom: 12 }}>Vital Signs</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "bpSystolic", label: "BP Systolic", unit: "mmHg" },
                  { key: "bpDiastolic", label: "BP Diastolic", unit: "mmHg" },
                  { key: "heartRate", label: "Heart Rate", unit: "bpm" },
                  { key: "temperature", label: "Temp", unit: "°C" },
                  { key: "spo2", label: "SpO₂", unit: "%" },
                  { key: "respiratoryRate", label: "RR", unit: "/min" },
                ].map(({ key, label, unit }) => (
                  <div key={key}>
                    <label style={{ fontSize: 10, color: "#93a096", display: "block", marginBottom: 3 }}>{label} <span style={{ color: "#5a6660" }}>({unit})</span></label>
                    <input
                      type="number"
                      className="input"
                      style={{ padding: "6px 10px", fontSize: 13 }}
                      disabled={signed}
                      value={(vitals as any)[key] ?? ""}
                      onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Reference Assist */}
            {refAssist && (
              <div className="glass-shell card glass p-4" style={{ borderRadius: 12 }}>
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={14} className="text-[#9fd8bd]" />
                    <span className="text-xs font-semibold text-[#eeeae0]">Clinical Reference Assist</span>
                  </div>
                  {copiedStatus && <span className="text-[10px] text-[#9fd8bd] animate-pulse">{copiedStatus}</span>}
                  <div className="flex gap-1 bg-white/5 p-0.5 rounded">
                    {(["reference", "calculators", "cases"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => { setAssistTab(tab); setActiveCalcId(null); setCalcResult(null); }}
                        className={`px-2 py-0.5 rounded text-[10px] capitalize transition-all ${
                          assistTab === tab ? "bg-[#9fd8bd] text-[#121614] font-medium" : "text-[#93a096] hover:text-[#eeeae0]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {assistTab === "reference" && (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {refAssist.diseases.length === 0 && refAssist.medications.length === 0 && refAssist.labs.length === 0 && (
                      <div className="text-[11px] text-[#93a096] text-center py-6">No matching reference protocols.</div>
                    )}
                    {/* Differentials */}
                    {refAssist.diseases.length > 0 && (
                      <div>
                        <div className="text-[9.5px] text-[#93a096] uppercase font-bold tracking-wider mb-1">Possible Differentials</div>
                        <div className="space-y-1">
                          {refAssist.diseases.map(d => (
                            <div key={d.id} className="p-2 rounded bg-white/5 border border-white/5 text-xs">
                              <div className="flex justify-between font-semibold text-[#eeeae0]">
                                <span className="hover:text-[#9fd8bd] cursor-pointer" onClick={() => handleCopyText(`Differential: ${d.name} (${d.icd10Code})`)}>{d.name}</span>
                                <span className="text-[#9fd8bd] font-mono text-[9px]">{d.icd10Code}</span>
                              </div>
                              {d.emergencyRedFlags?.length > 0 && (
                                <div className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
                                  <AlertTriangle size={8} /> Red Flags: {d.emergencyRedFlags.slice(0, 2).join(", ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Labs */}
                    {refAssist.labs.length > 0 && (
                      <div>
                        <div className="text-[9.5px] text-[#93a096] uppercase font-bold tracking-wider mb-1">Recommended Investigations</div>
                        <div className="flex flex-wrap gap-1">
                          {refAssist.labs.map(p => (
                            <span
                              key={p.id}
                              onClick={() => handleCopyText(`Order Test: ${p.testName}`)}
                              className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10.5px] text-[#a3d1df] hover:border-[#a3d1df]/40 cursor-pointer"
                            >
                              {p.testName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medications */}
                    {refAssist.medications.length > 0 && (
                      <div>
                        <div className="text-[9.5px] text-[#93a096] uppercase font-bold tracking-wider mb-1">Suggested Medications</div>
                        <div className="space-y-1">
                          {refAssist.medications.map(m => (
                            <div
                              key={m.id}
                              onClick={() => handleCopyText(`Medication monograph: ${m.genericName} - Dosing: ${m.adultDosing}`)}
                              className="p-1.5 rounded bg-white/5 border border-white/5 text-[11px] text-[#eeeae0] cursor-pointer hover:border-white/20"
                            >
                              <div className="font-semibold text-xs">{m.genericName}</div>
                              <div className="text-[10px] text-[#93a096] mt-0.5 line-clamp-1">{m.adultDosing}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {assistTab === "calculators" && (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {refAssist.calculators.length === 0 && (
                      <div className="text-[11px] text-[#93a096] text-center py-6">No specific calculators recommended.</div>
                    )}

                    {!activeCalcId && refAssist.calculators.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setActiveCalcId(c.id); setCalcInputs({}); setCalcResult(null); }}
                        className="w-full text-left p-2.5 rounded bg-white/5 border border-white/5 text-xs hover:bg-white/10 flex justify-between items-center"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-[#eeeae0] truncate">{c.name}</div>
                          <div className="text-[10px] text-[#93a096] truncate">{c.description}</div>
                        </div>
                        <ChevronRight size={12} className="text-[#93a096] flex-shrink-0" />
                      </button>
                    ))}

                    {activeCalcId && (
                      <div className="space-y-3">
                        {(() => {
                          const calc = refAssist.calculators.find(x => x.id === activeCalcId);
                          if (!calc) return null;
                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-[#eeeae0]">{calc.name}</span>
                                <button onClick={() => setActiveCalcId(null)} className="text-[10px] text-[#93a096] hover:underline">Back</button>
                              </div>
                              <div className="space-y-1.5">
                                {calc.inputs.map((inp: any) => (
                                  <label key={inp.key} className="flex items-center justify-between text-[11px] text-[#eeeae0]">
                                    <span>{inp.label}</span>
                                    {inp.type === "boolean" ? (
                                      <input
                                        type="checkbox"
                                        checked={!!calcInputs[inp.key]}
                                        onChange={e => setCalcInputs(prev => ({ ...prev, [inp.key]: e.target.checked }))}
                                      />
                                    ) : (
                                      <input
                                        type="number"
                                        className="input"
                                        style={{ width: 70, padding: "3px 6px", fontSize: 11 }}
                                        value={(calcInputs[inp.key] as any) ?? ""}
                                        onChange={e => setCalcInputs(prev => ({ ...prev, [inp.key]: Number(e.target.value) }))}
                                      />
                                    )}
                                  </label>
                                ))}
                              </div>
                              <button
                                onClick={async () => {
                                  const res = await api.post(`/clinical-knowledge/calculators/${calc.id}/calculate`, { inputs: calcInputs });
                                  setCalcResult(res.data.data ?? res.data);
                                }}
                                className="btn-primary w-full text-[11px] py-1"
                              >
                                Run Calculator
                              </button>
                              {calcResult && (
                                <div className="p-2 rounded bg-[#9fd8bd]/10 border border-[#9fd8bd]/25 text-[11px]">
                                  <div className="font-bold text-[#9fd8bd]">Score: {calcResult.score} ({calcResult.category})</div>
                                  <p className="text-[10.5px] text-[#eeeae0] mt-0.5">{calcResult.interpretation}</p>
                                  <button
                                    onClick={() => handleCopyText(`${calc.name} Score: ${calcResult.score} (${calcResult.category}). Interpretation: ${calcResult.interpretation}`)}
                                    className="text-[10px] text-[#a3d1df] hover:underline mt-1 block"
                                  >
                                    Copy Result to Note
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {assistTab === "cases" && (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {refAssist.cases.length === 0 && (
                      <div className="text-[11px] text-[#93a096] text-center py-6">No historical clinical matches.</div>
                    )}
                    {refAssist.cases.map((c: any) => (
                      <div key={c.id} className="p-2.5 rounded bg-white/5 border border-white/5 text-xs space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span className="text-[#eeeae0]">{c.firstName} {c.lastName}</span>
                          <span className="text-[10px] text-[#93a096] font-mono">{c.mrn}</span>
                        </div>
                        <div className="text-[10.5px] text-[#fb923c]">Chief Complaint: {c.chiefComplaint || "n/a"}</div>
                        {c.assessment && <div className="text-[10px] text-[#93a096] line-clamp-2">Assessment: {c.assessment}</div>}
                        <button
                          onClick={() => handleCopyText(`Historical case reference: Chief complaint: ${c.chiefComplaint || "n/a"}. Assessment: ${c.assessment || "n/a"}`)}
                          className="text-[9.5px] text-[#9fd8bd] hover:underline mt-1 block"
                        >
                          Copy Case Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* Allergies reminder */}
            {patient && patient.allergies.length > 0 && (

              <div className="card glass" style={{ borderRadius: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "#f87171", marginBottom: 8 }}>
                  <AlertTriangle size={11} style={{ display: "inline", marginRight: 5 }} />
                  Allergy Alerts
                </h3>
                <div className="space-y-1.5">
                  {patient.allergies.map((a, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#eeeae0", padding: "5px 9px", borderRadius: 6, background: "rgba(248,113,113,0.07)", borderLeft: "2px solid #f87171" }}>
                      {a.substance} <span style={{ color: "#93a096", fontSize: 11 }}>({a.severity})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Encounter info */}
            <div className="glass-shell card glass" style={{ borderRadius: 12 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: "#eeeae0", marginBottom: 10 }}>Encounter Info</h3>
              <div className="space-y-2">
                {[
                  { label: "Started", value: encounter ? new Date(encounter.createdAt).toLocaleString() : "—" },
                  { label: "Status", value: encounter?.status ?? "—" },
                  { label: "Encounter ID", value: encounterId?.slice(0, 8) + "..." },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between" style={{ fontSize: 12 }}>
                    <span style={{ color: "#93a096" }}>{label}</span>
                    <span style={{ color: "#eeeae0" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
