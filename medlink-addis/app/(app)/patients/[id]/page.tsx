"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User, Phone, Mail, Droplets, Calendar, Shield, AlertTriangle,
  ChevronLeft, Plus, Stethoscope, Activity, ClipboardList, Loader2,
  CheckCircle, Clock, FileText, ArrowUpRight, DollarSign, BedDouble
} from "lucide-react";
import Topbar from "@/components/Topbar";
import { usePatientsStore, Encounter } from "@/store/patientsStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

type Tab = "demographics" | "encounters" | "timeline" | "new-encounter";

const SEVERITY_COLOR: Record<string, string> = {
  low: "#9fd8bd", moderate: "#e2a356", high: "#fb923c", critical: "#f87171",
};

const STATUS_CLASS: Record<string, string> = {
  "In Progress": "badge-amber",
  "Signed": "badge-green",
  "Amended": "badge-blue",
};

const TIMELINE_ICONS: Record<string, any> = {
  "appointment booked": Calendar,
  "patient checked in": Clock,
  "encounter started": Stethoscope,
  "encounter signed": CheckCircle,
  "lab ordered": ClipboardList,
  "lab completed": CheckCircle,
  "prescription created": FileText,
  "invoice generated": DollarSign,
  "payment completed": CheckCircle,
  "patient admitted": BedDouble,
  "ward transferred": ArrowUpRight,
  "discharge completed": CheckCircle,
};

const TIMELINE_COLORS: Record<string, string> = {
  "appointment booked": "#a3d1df",
  "patient checked in": "#9fd8bd",
  "encounter started": "#fb923c",
  "encounter signed": "#9fd8bd",
  "lab ordered": "#a3d1df",
  "lab completed": "#9fd8bd",
  "prescription created": "#fb923c",
  "invoice generated": "#facc15",
  "payment completed": "#9fd8bd",
  "patient admitted": "#f87171",
  "ward transferred": "#a3d1df",
  "discharge completed": "#93a096",
};

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function PatientChartPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuthStore();
  const {
    selectedPatient: patient,
    encounters,
    loading,
    error,
    fetchPatient,
    fetchEncounters,
    createEncounter,
  } = usePatientsStore();

  const [tab, setTab] = useState<Tab>("demographics");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [creatingEnc, setCreatingEnc] = useState(false);
  const [encError, setEncError] = useState<string | null>(null);

  // Timeline state
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const fetchTimeline = useCallback(async () => {
    if (!id) return;
    setTimelineLoading(true);
    try {
      const response = await api.get(`/patients/${id}/timeline`);
      setTimelineEvents(response.data.data);
    } catch (err) {
      console.error("Failed to fetch timeline", err);
    } finally {
      setTimelineLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPatient(id);
      fetchEncounters(id);
    }
  }, [id, fetchPatient, fetchEncounters]);

  useEffect(() => {
    if (tab === "timeline") {
      fetchTimeline();
    }
  }, [tab, fetchTimeline]);

  const handleStartEncounter = useCallback(async () => {
    if (!chiefComplaint.trim()) return;
    setCreatingEnc(true);
    setEncError(null);
    const enc = await createEncounter(id, chiefComplaint.trim());
    setCreatingEnc(false);
    if (enc) {
      router.push(`/clinical/${enc.id}`);
    } else {
      setEncError(usePatientsStore.getState().error ?? "Failed to create encounter");
    }
  }, [chiefComplaint, id, createEncounter, router]);

  if (loading && !patient) {
    return (
      <>
        <Topbar title="Patient Chart" />
        <main className="p-6 flex items-center justify-center" style={{ minHeight: 400 }}>
          <Loader2 className="animate-spin text-[#9fd8bd]" size={32} />
        </main>
      </>
    );
  }

  if (error && !patient) {
    return (
      <>
        <Topbar title="Patient Chart" />
        <main className="p-6">
          <div className="text-red-400 text-sm">{error}</div>
        </main>
      </>
    );
  }

  if (!patient) return null;

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`;

  return (
    <>
      <Topbar title="Patient Chart" />
      <main className="p-6 space-y-5">
        {/* Back */}
        <button
          onClick={() => router.push("/patients")}
          className="flex items-center gap-2 btn-ghost"
          style={{ fontSize: 13 }}
        >
          <ChevronLeft size={14} /> All Patients
        </button>

        {/* Patient banner */}
        <div className="glass card flex items-center justify-between" style={{ borderRadius: 12 }}>
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: "rgba(159,216,189,0.12)", color: "#9fd8bd", border: "1px solid rgba(159,216,189,0.25)" }}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#eeeae0" }}>
                  {patient.firstName} {patient.lastName}
                </h1>
                {patient.allergies.length > 0 && (
                  <span className="badge badge-red flex items-center gap-1">
                    <AlertTriangle size={10} /> Allergies
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: "#93a096", marginTop: 4, display: "flex", gap: 16 }}>
                <span>{patient.mrn}</span>
                <span>·</span>
                <span>{age(patient.dateOfBirth)} y/o {patient.gender}</span>
                {patient.bloodType && (
                  <><span>·</span><span style={{ color: "#f87171" }}>{patient.bloodType}</span></>
                )}
              </div>
            </div>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            style={{ fontSize: 12, padding: "9px 18px" }}
            onClick={() => setTab("new-encounter")}
          >
            <Plus size={13} /> New Encounter
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1" style={{ borderBottom: "1px solid rgba(238,234,224,0.08)", paddingBottom: 0 }}>
          {(["demographics", "encounters", "timeline", "new-encounter"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontSize: 12.5,
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? "#9fd8bd" : "#93a096",
                padding: "8px 16px",
                borderBottom: tab === t ? "2px solid #9fd8bd" : "2px solid transparent",
                background: "none",
                border: "none",
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "color 0.2s",
              }}
            >
              {t.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* ─── Demographics Tab ─── */}
        {tab === "demographics" && (
          <div className="grid grid-cols-2 gap-5">
            {/* Personal info */}
            <div className="glass-shell card glass" style={{ borderRadius: 12 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: "#9fd8bd", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Personal Information</h3>
              <div className="space-y-4">
                {[
                  { icon: User, label: "Full Name", value: `${patient.firstName} ${patient.lastName}` },
                  { icon: Calendar, label: "Date of Birth", value: `${patient.dateOfBirth} (${age(patient.dateOfBirth)} years)` },
                  { icon: User, label: "Gender", value: patient.gender },
                  { icon: Droplets, label: "Blood Type", value: patient.bloodType ?? "Not recorded" },
                  { icon: Phone, label: "Phone", value: patient.primaryPhone ?? "Not recorded" },
                  { icon: Mail, label: "Email", value: patient.primaryEmail ?? "Not recorded" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(159,216,189,0.08)", flexShrink: 0 }}>
                      <Icon size={12} style={{ color: "#9fd8bd" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, color: "#93a096", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: "#eeeae0" }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Allergies */}
              <div className="glass-shell card glass" style={{ borderRadius: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                  <AlertTriangle size={11} style={{ display: "inline", marginRight: 6 }} />
                  Allergies
                </h3>
                {patient.allergies.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: "#93a096" }}>No known allergies</div>
                ) : (
                  <div className="space-y-2">
                    {patient.allergies.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg"
                        style={{ background: `${SEVERITY_COLOR[a.severity]}0a`, border: `1px solid ${SEVERITY_COLOR[a.severity]}20` }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#eeeae0" }}>{a.substance}</div>
                          {a.reaction && <div style={{ fontSize: 11, color: "#93a096" }}>{a.reaction}</div>}
                        </div>
                        <span className="badge" style={{ background: `${SEVERITY_COLOR[a.severity]}18`, color: SEVERITY_COLOR[a.severity], border: `1px solid ${SEVERITY_COLOR[a.severity]}30`, fontSize: 10 }}>
                          {a.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Medical flags */}
              <div className="glass-shell card glass" style={{ borderRadius: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: "#e2a356", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                  <Shield size={11} style={{ display: "inline", marginRight: 6 }} />
                  Medical Flags
                </h3>
                {patient.medicalFlags.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: "#93a096" }}>No flags recorded</div>
                ) : (
                  <div className="space-y-2">
                    {patient.medicalFlags.map((f, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: "#eeeae0", padding: "6px 10px", borderRadius: 6, background: "rgba(226,163,86,0.07)", borderLeft: "2px solid #e2a356" }}>
                        {f.type} {f.note && <span style={{ color: "#93a096" }}>— {f.note}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Encounters Tab ─── */}
        {tab === "encounters" && (
          <div className="glass-shell card glass" style={{ borderRadius: 12, padding: 0, overflow: "hidden" }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid rgba(238,234,224,0.06)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#eeeae0" }}>Encounter History ({encounters.length})</h3>
              <button
                className="btn-primary flex items-center gap-1.5"
                style={{ fontSize: 12, padding: "7px 14px" }}
                onClick={() => setTab("new-encounter")}
              >
                <Plus size={12} /> Start Encounter
              </button>
            </div>
            {encounters.length === 0 ? (
              <div className="p-8 text-center" style={{ color: "#93a096", fontSize: 13 }}>
                No encounters recorded for this patient yet.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Chief Complaint</th>
                    <th>Status</th>
                    <th>Vitals</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {encounters.map((enc: Encounter) => (
                    <tr
                      key={enc.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/clinical/${enc.id}`)}
                    >
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "#93a096" }}>
                        {new Date(enc.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ color: "#eeeae0", maxWidth: 200 }}>{enc.chiefComplaint ?? "—"}</td>
                      <td>
                        <span className={`badge ${STATUS_CLASS[enc.status] ?? "badge-neutral"}`}>{enc.status}</span>
                      </td>
                      <td style={{ color: "#93a096", fontSize: 12 }}>
                        {enc.vitalSigns
                          ? `BP ${enc.vitalSigns.bpSystolic ?? "?"}/${enc.vitalSigns.bpDiastolic ?? "?"} · HR ${enc.vitalSigns.heartRate ?? "?"}bpm`
                          : <span style={{ color: "#93a096", fontStyle: "italic", fontSize: 11 }}>Not recorded</span>
                        }
                      </td>
                      <td><ArrowUpRight size={13} style={{ color: "#9fd8bd" }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── Timeline Tab ─── */}
        {tab === "timeline" && (
          <div className="glass-shell card glass relative" style={{ borderRadius: 12, minHeight: 250 }}>
            {timelineLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-xl">
                <Loader2 className="animate-spin text-[#9fd8bd]" size={24} />
              </div>
            )}
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#eeeae0", marginBottom: 20 }}>Unified Patient Timeline</h3>
            
            {timelineEvents.length === 0 && !timelineLoading ? (
              <div className="text-center py-10 text-[#93a096]" style={{ fontSize: 13 }}>
                No timeline events recorded yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 border-l border-white/10" style={{ marginLeft: 10 }}>
                {timelineEvents.map((evt: any) => {
                  const Icon = TIMELINE_ICONS[evt.eventType] || Stethoscope;
                  const color = TIMELINE_COLORS[evt.eventType] || "#eeeae0";
                  return (
                    <div key={evt.id} className="relative">
                      {/* Timeline Dot Icon */}
                      <span className="absolute -left-10 top-0.5 flex h-7 w-7 items-center justify-center rounded-full"
                        style={{ background: `${color}15`, border: `1px solid ${color}35`, color }}>
                        <Icon size={12} />
                      </span>
                      {/* Timeline Content */}
                      <div>
                        <div className="flex items-center gap-3">
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: "#eeeae0" }}>{evt.title}</span>
                          <span style={{ fontSize: 11, color: "#93a096" }}>
                            {new Date(evt.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="mt-1" style={{ fontSize: 12.5, color: "#93a096", lineHeight: 1.4 }}>{evt.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── New Encounter Tab ─── */}
        {tab === "new-encounter" && (
          <div className="glass-shell card glass" style={{ borderRadius: 12, maxWidth: 560 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#eeeae0", marginBottom: 4 }}>Start New Clinical Encounter</h3>
            <p style={{ fontSize: 12, color: "#93a096", marginBottom: 20 }}>Enter the chief complaint to open the encounter and navigate to the SOAP editor.</p>

            <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Chief Complaint *</label>
            <textarea
              className="input mt-2 mb-5"
              rows={3}
              placeholder="e.g. Chest pain radiating to left arm, onset 2 hours ago…"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              style={{ resize: "vertical" }}
            />

            {encError && (
              <div className="text-red-400 text-xs mb-4">{encError}</div>
            )}

            <div className="flex items-center gap-3">
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setTab("encounters")}>
                Cancel
              </button>
              <button
                className="btn-primary flex items-center gap-2"
                style={{ fontSize: 13 }}
                disabled={creatingEnc || !chiefComplaint.trim()}
                onClick={handleStartEncounter}
              >
                {creatingEnc ? <Loader2 size={14} className="animate-spin" /> : <Stethoscope size={14} />}
                Open Encounter
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
