"use client";
import { useEffect, useState, useRef } from "react";
import Topbar from "@/components/Topbar";
import { Plus, Loader2, X, Search, Heart, AlertTriangle, ShieldCheck, ChevronRight, CheckCircle } from "lucide-react";
import { useEmergencyStore, TriageEntry } from "@/store/emergencyStore";
import { usePatientsStore } from "@/store/patientsStore";

const priorityColors: Record<number, string> = {
  1: "#f87171",
  2: "#fb923c",
  3: "#facc15",
  4: "#a3d1df",
  5: "#93a096",
};

// ---- Register ER Triage Modal ----
function RegisterTriageModal({ onClose }: { onClose: () => void }) {
  const { createTriageEntry, loading: entryLoading } = useEmergencyStore();
  const { patients, fetchPatients, loading: patientsLoading } = usePatientsStore();

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("unknown");
  const [complaint, setComplaint] = useState("");
  const [priority, setPriority] = useState("3");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const debounceRef = useRef<any>(null);

  useEffect(() => {
    fetchPatients("", 1);
  }, [fetchPatients]);

  const handlePatientSearchChange = (val: string) => {
    setPatientSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPatients(val, 1), 300);
  };

  const handleSelectPatient = (pId: string) => {
    setSelectedPatientId(pId);
    const p = patients.find((pat) => pat.id === pId);
    if (p) {
      setPatientName(`${p.firstName} ${p.lastName}`);
      // Compute age approximately
      const ageYears = Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
      setAge(String(ageYears));
      setGender(p.gender);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!patientName.trim()) {
      setErr("Please enter the patient's name.");
      return;
    }
    if (!age || isNaN(parseInt(age))) {
      setErr("Please enter a valid age.");
      return;
    }
    if (!complaint.trim()) {
      setErr("Please describe the chief complaint.");
      return;
    }

    const ok = await createTriageEntry({
      patientId: selectedPatientId || undefined,
      patientName: patientName.trim(),
      age: parseInt(age),
      gender,
      complaint: complaint.trim(),
      priority: parseInt(priority),
    });

    if (ok) {
      setSuccess(true);
      setTimeout(onClose, 1000);
    } else {
      setErr(useEmergencyStore.getState().error ?? "Failed to create triage entry.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="glass card" style={{ borderRadius: 14, width: 500, padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#eeeae0" }}>Emergency Triage Intake</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <Heart size={32} className="text-[#f87171] mx-auto mb-2 animate-pulse" />
            <h3 style={{ fontSize: 14, color: "#eeeae0", fontWeight: 600 }}>Triage Record Registered</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Link Existing Patient (Optional)</label>
              <div className="relative mb-2">
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#93a096" }} />
                <input
                  className="input pl-8 text-[12.5px] w-full"
                  placeholder="Search registered patients..."
                  value={patientSearch}
                  onChange={(e) => handlePatientSearchChange(e.target.value)}
                />
              </div>
              <select
                className="input w-full text-[13px]"
                value={selectedPatientId}
                onChange={(e) => handleSelectPatient(e.target.value)}
                size={patients.length > 0 ? Math.min(patients.length, 3) : 1}
                style={{ height: "auto", maxHeight: 90 }}
              >
                <option value="">-- No Link (Anonymous Trauma / New Patient) --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mrn})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Patient Name *</label>
              <input
                required
                className="input w-full"
                placeholder="e.g. John Doe (or Trauma Patient Male)"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Age *</label>
                <input
                  required
                  type="number"
                  className="input w-full"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Gender</label>
                <select className="input w-full" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="unknown">Unknown</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Triage Priority</label>
                <select className="input w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="1">P1 - Immediate (Red)</option>
                  <option value="2">P2 - Emergent (Orange)</option>
                  <option value="3">P3 - Urgent (Yellow)</option>
                  <option value="4">P4 - Semi-Urgent (Teal)</option>
                  <option value="5">P5 - Non-Urgent (Gray)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Chief Complaint *</label>
              <textarea
                required
                className="input w-full"
                rows={3}
                placeholder="Describe presenting symptoms, mechanisms of injury, vitals..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
              />
            </div>

            {err && <div className="text-red-400 text-xs">{err}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary flex items-center gap-2" style={{ fontSize: 13 }} disabled={entryLoading}>
                {entryLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Admit to Triage
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---- Triage Status Update Modal ----
function StatusUpdateModal({ entry, onClose }: { entry: TriageEntry; onClose: () => void }) {
  const { updateTriageStatus, loading } = useEmergencyStore();
  const [status, setStatus] = useState<any>(entry.status);
  const [priority, setPriority] = useState(String(entry.priority));
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const ok = await updateTriageStatus(entry.id, {
      status,
      priority: parseInt(priority),
    });

    if (ok) {
      setSuccess(true);
      setTimeout(onClose, 1000);
    } else {
      setErr(useEmergencyStore.getState().error ?? "Failed to update triage status.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="glass card" style={{ borderRadius: 14, width: 440, padding: 28 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#eeeae0" }}>Update Triage status</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
        </div>

        <div className="p-3 mb-4 rounded-lg bg-white/5 border border-white/10" style={{ fontSize: 12 }}>
          <div style={{ color: "#93a096" }}>Patient: <strong style={{ color: "#eeeae0" }}>{entry.patientName}</strong></div>
          <div style={{ color: "#93a096", marginTop: 2 }}>Current Priority: <strong style={{ color: priorityColors[entry.priority] }}>P{entry.priority} - {entry.priorityLabel}</strong></div>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle size={32} className="text-[#9fd8bd] mx-auto mb-2" />
            <h3 style={{ fontSize: 14, color: "#eeeae0", fontWeight: 600 }}>Triage Record Updated</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Triage Priority</label>
              <select className="input w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="1">P1 - Immediate (Red)</option>
                <option value="2">P2 - Emergent (Orange)</option>
                <option value="3">P3 - Urgent (Yellow)</option>
                <option value="4">P4 - Semi-Urgent (Teal)</option>
                <option value="5">P5 - Non-Urgent (Gray)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Status</label>
              <select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Waiting">Waiting</option>
                <option value="Assessment">Assessment</option>
                <option value="Treatment">Treatment</option>
                <option value="Resuscitation">Resuscitation</option>
                <option value="Discharged">Discharged (Archive)</option>
                <option value="Admitted">Admitted (Transfer Ward)</option>
              </select>
            </div>

            {err && <div className="text-red-400 text-xs">{err}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary flex items-center gap-2" style={{ fontSize: 13 }} disabled={loading}>
                {loading ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
                Apply Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---- Main Page Component ----
export default function EmergencyPage() {
  const { triageQueue, loading, error, fetchQueue } = useEmergencyStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TriageEntry | null>(null);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Aggregate stats
  const activeQueue = triageQueue.filter((t) => t.status !== "Discharged" && t.status !== "Admitted");
  const countByPriority = (p: number) => activeQueue.filter((t) => t.priority === p).length;

  return (
    <>
      {showModal && <RegisterTriageModal onClose={() => setShowModal(false)} />}
      {selectedEntry && <StatusUpdateModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
      <Topbar title="Emergency Triage" />
      <main className="p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 glow-pulse" />
            <span style={{ fontSize: 13, color: "#eeeae0", fontWeight: 600 }}>Live Triage Board</span>
            <span className="badge badge-red">{activeQueue.length} active patients</span>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            style={{ padding: "10px 20px", fontSize: 13 }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} /> Intake Patient
          </button>
        </div>

        {error && <div className="text-red-400 text-sm mb-4">Error: {error}</div>}

        {/* Priority summary */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { p: 1, label: "P1 Immediate", color: "#f87171" },
            { p: 2, label: "P2 Emergent", color: "#fb923c" },
            { p: 3, label: "P3 Urgent", color: "#facc15" },
            { p: 4, label: "P4 Semi-Urgent", color: "#a3d1df" },
            { p: 5, label: "P5 Non-Urgent", color: "#93a096" },
          ].map(({ p, label, color }) => (
            <div key={p} className="card glass animate-fade-in" style={{ borderRadius: 10, borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: "1.8rem", fontFamily: "var(--font-display)", fontWeight: 300, color: "#eeeae0", lineHeight: 1 }}>
                {countByPriority(p)}
              </div>
              <div style={{ fontSize: 11, color: "#93a096", marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Queue */}
        <div className="space-y-3 relative min-h-[250px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-sm z-10 rounded-xl">
              <Loader2 className="animate-spin text-[#9fd8bd]" size={24} />
            </div>
          )}
          {activeQueue.length === 0 && !loading && (
            <div className="glass card text-center py-12 text-[#93a096]" style={{ borderRadius: 12 }}>
              No active patients in emergency triage queue.
            </div>
          )}
          {activeQueue.map((patient) => {
            const timeSinceArrived = Math.round((Date.now() - new Date(patient.arrivedAt).getTime()) / (60 * 1000));
            const waitStr = timeSinceArrived > 60
              ? `${Math.floor(timeSinceArrived / 60)}h ${timeSinceArrived % 60}m`
              : `${timeSinceArrived} min`;

            return (
              <div
                key={patient.id}
                className="glass-shell card glass transition-transform hover:scale-[1.005] cursor-pointer"
                style={{ borderRadius: 12, borderLeft: `3px solid ${patient.color}` }}
                onClick={() => setSelectedEntry(patient)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-center flex-shrink-0" style={{ width: 40 }}>
                      <div style={{ fontSize: "1.4rem", fontFamily: "var(--font-display)", fontWeight: 300, color: patient.color, lineHeight: 1 }}>P{patient.priority}</div>
                      <div style={{ fontSize: 9, color: patient.color, marginTop: 2 }}>{patient.priorityLabel}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#eeeae0" }}>{patient.patientName}</span>
                        <span style={{ fontSize: 12, color: "#93a096" }}>Age {patient.age}</span>
                        <span style={{ fontSize: 12, color: "#93a096", textTransform: "capitalize" }}>({patient.gender})</span>
                      </div>
                      <p style={{ fontSize: 12.5, color: "#eeeae0", lineHeight: 1.4 }}>{patient.complaint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <div style={{ fontSize: 11, color: "#93a096" }}>Arrived</div>
                      <div style={{ fontSize: 13, color: "#eeeae0", fontWeight: 500 }}>
                        {new Date(patient.arrivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontSize: 11, color: "#93a096" }}>Wait</div>
                      <div style={{ fontSize: 13, color: patient.priority <= 2 ? "#f87171" : "#eeeae0", fontWeight: 500 }}>{waitStr}</div>
                    </div>
                    <span className="badge" style={{ color: patient.color, borderColor: `${patient.color}40`, background: `${patient.color}10` }}>
                      {patient.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
