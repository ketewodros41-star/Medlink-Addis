"use client";
import { useEffect, useState, useRef } from "react";
import Topbar from "@/components/Topbar";
import {
  AlertTriangle,
  ArrowRightLeft,
  BedDouble,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  ShieldCheck,
  Sparkles,
  Loader2,
  X,
  UserCheck,
  Trash2
} from "lucide-react";
import { useBedsStore, Bed, Ward, BedAdmission } from "@/store/bedsStore";
import { usePatientsStore } from "@/store/patientsStore";

export default function AdmissionsPage() {
  const {
    wards,
    admissions,
    loading: bedsLoading,
    error: bedsError,
    fetchWards,
    fetchAdmissions,
    assignBed,
    releaseBed
  } = useBedsStore();

  const {
    patients,
    fetchPatients,
    loading: patientsLoading
  } = usePatientsStore();

  // Selected ward tab
  const [selectedWardId, setSelectedWardId] = useState<string>("");

  // Modals state
  const [admitBed, setAdmitBed] = useState<Bed | null>(null);
  const [admitWard, setAdmitWard] = useState<Ward | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [showPatientsDropdown, setShowPatientsDropdown] = useState(false);
  const debounceRef = useRef<any>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  useEffect(() => {
    fetchWards();
    fetchAdmissions();
  }, [fetchWards, fetchAdmissions]);

  // Set first ward as default when loaded
  useEffect(() => {
    if (wards.length > 0 && !selectedWardId) {
      setSelectedWardId(wards[0].id);
    }
  }, [wards, selectedWardId]);

  // Debounced Patient Search
  const handlePatientSearchChange = (val: string) => {
    setPatientSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPatients(val, 1);
      setShowPatientsDropdown(true);
    }, 300);
  };

  const handleAdmit = async () => {
    if (!admitBed || !selectedPatientId) {
      setActionErr("Please select a patient");
      return;
    }
    setActionLoading(true);
    setActionErr(null);
    const ok = await assignBed(selectedPatientId, admitBed.id);
    setActionLoading(false);
    if (ok) {
      setAdmitBed(null);
      setPatientSearch("");
      setSelectedPatientId("");
    } else {
      setActionErr(useBedsStore.getState().error ?? "Failed to assign bed");
    }
  };

  const handleDischarge = async (admissionId: string) => {
    if (!confirm("Are you sure you want to discharge this patient and release the bed?")) return;
    setActionLoading(true);
    try {
      await releaseBed(admissionId);
    } catch (e: any) {
      alert("Failed to release bed: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const activeWard = wards.find(w => w.id === selectedWardId);
  const totalBeds = wards.reduce((sum, w) => sum + (w.beds?.length || 0), 0);
  const occupiedBeds = admissions.length;
  const availableBeds = totalBeds - occupiedBeds;

  const kpis = [
    { label: "Total Beds Configured", value: totalBeds, delta: "Active Capacity", color: "#a3d1df", icon: BedDouble },
    { label: "Beds Available", value: availableBeds, delta: `${totalBeds > 0 ? Math.round((availableBeds/totalBeds)*100) : 0}% free`, color: "#9fd8bd", icon: Sparkles },
    { label: "Admitted Patients", value: occupiedBeds, delta: "Active Wards", color: "#e2a356", icon: ClipboardList },
    { label: "Critical Care (ICU)", value: admissions.filter(a => a.bed?.ward?.name === 'ICU').length, delta: "High priority", color: "#f87171", icon: AlertTriangle },
  ];

  return (
    <>
      <Topbar title="Admissions & Bed Management" />
      <main className="p-6 space-y-6">
        
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map(({ label, value, delta, color, icon: Icon }) => (
            <div key={label} className="glass-shell card glass" style={{ borderRadius: 10 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span style={{ fontSize: 10, color }}>{delta}</span>
              </div>
              <div className="stat-number" style={{ fontSize: "1.55rem" }}>
                {bedsLoading ? <Loader2 className="animate-spin" size={16} /> : value}
              </div>
              <div style={{ fontSize: 11, color: "#93a096", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Ward tabs selection */}
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10" style={{ maxWidth: "max-content" }}>
          {wards.map((w) => {
            const wardAdmissions = admissions.filter(a => a.bed?.ward?.name === w.name).length;
            const active = selectedWardId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setSelectedWardId(w.id)}
                className={`px-4 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-2 ${
                  active ? "bg-[#9fd8bd] text-[#121614] shadow" : "text-[#93a096] hover:text-[#eeeae0]"
                }`}
              >
                <span>{w.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${active ? "bg-[#121614]/20" : "bg-white/10"}`}>
                  {wardAdmissions}/{w.beds?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Visual Bed Grid Map */}
        <div className="glass-shell card glass p-5 relative" style={{ borderRadius: 12, minHeight: 300 }}>
          {bedsLoading && !admitBed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-xl">
              <Loader2 className="animate-spin text-[#9fd8bd]" size={24} />
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#eeeae0" }}>
              {activeWard ? `${activeWard.name} Bed Grid Map` : "Loading Wards..."}
            </h2>
            <div className="flex gap-4 text-xs text-[#93a096]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/40" /> Occupied</span>
            </div>
          </div>

          {activeWard && (!activeWard.beds || activeWard.beds.length === 0) ? (
            <div className="text-center py-10 text-[#93a096] text-xs">
              No physical beds configured for this ward.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {activeWard?.beds?.map((bed) => {
                const activeAdm = admissions.find(a => a.bedId === bed.id);
                const occupied = bed.status === "Occupied";
                return (
                  <div
                    key={bed.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      occupied
                        ? "bg-red-500/5 border-red-500/20 hover:border-red-500/35"
                        : "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/35"
                    }`}
                    style={{ minHeight: 130 }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span style={{ fontSize: 11, color: "#93a096" }}>{bed.roomNumber}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                          occupied ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {bed.bedNumber}
                        </span>
                      </div>

                      {occupied && activeAdm ? (
                        <div className="mt-2">
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#eeeae0" }}>
                            {activeAdm.patient?.firstName} {activeAdm.patient?.lastName}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#93a096", marginTop: 2 }}>
                            {activeAdm.patient?.mrn}
                          </div>
                          <div style={{ fontSize: 9.5, color: "#93a096", marginTop: 4 }}>
                            In: {new Date(activeAdm.admittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-[#93a096] italic">
                          Bed clean & available
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                      {occupied && activeAdm ? (
                        <button
                          onClick={() => handleDischarge(activeAdm.id)}
                          className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                          disabled={actionLoading}
                        >
                          <Trash2 size={11} /> Discharge
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setActionErr(null);
                            setAdmitWard(activeWard);
                            setAdmitBed(bed);
                          }}
                          className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1"
                        >
                          <UserCheck size={11} /> Admit Patient
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Admit Patient Modal ─── */}
        {admitBed && admitWard && (
          <div className="modal-backdrop">
            <div className="modal-content glass shadow-xl" style={{ maxWidth: 420, width: "100%" }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#eeeae0]" style={{ fontSize: 15 }}>Admit to Ward</h3>
                <button onClick={() => setAdmitBed(null)} className="text-[#93a096] hover:text-[#eeeae0]">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 mb-5">
                <div className="grid grid-cols-2 gap-2 text-xs text-[#93a096]">
                  <div>Ward: <strong className="text-[#eeeae0]">{admitWard.name}</strong></div>
                  <div>Bed: <strong className="text-[#eeeae0]">{admitBed.roomNumber} - {admitBed.bedNumber}</strong></div>
                </div>

                {/* Patient Search */}
                <div className="relative">
                  <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Search Patient *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Type name or MRN..."
                    value={patientSearch}
                    onChange={(e) => handlePatientSearchChange(e.target.value)}
                  />
                  {showPatientsDropdown && patientSearch && (
                    <div className="absolute left-0 right-0 mt-1 rounded-lg border border-white/10 bg-[#1e2521] shadow-2xl z-20 max-h-40 overflow-y-auto">
                      {patientsLoading && <div className="p-3 text-xs text-[#93a096]">Searching...</div>}
                      {patients.length === 0 && !patientsLoading && <div className="p-3 text-xs text-[#93a096]">No patient found</div>}
                      {patients.map(p => (
                        <div
                          key={p.id}
                          className="p-2.5 hover:bg-white/5 cursor-pointer text-xs flex justify-between"
                          onClick={() => {
                            setSelectedPatientId(p.id);
                            setPatientSearch(`${p.firstName} ${p.lastName} (${p.mrn})`);
                            setShowPatientsDropdown(false);
                          }}
                        >
                          <span style={{ color: "#eeeae0" }}>{p.firstName} {p.lastName}</span>
                          <span style={{ color: "#93a096" }}>{p.mrn}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {actionErr && <div className="text-red-400 text-xs mb-4">{actionErr}</div>}

              <div className="flex justify-end gap-3 pt-3" style={{ borderTop: "1px solid rgba(238,234,224,0.06)" }}>
                <button onClick={() => setAdmitBed(null)} className="btn-secondary" style={{ fontSize: 12.5 }}>Cancel</button>
                <button onClick={handleAdmit} disabled={actionLoading} className="btn-primary" style={{ fontSize: 12.5 }}>
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : "Admit Patient"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
