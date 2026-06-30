"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import { Search, Plus, Filter, ChevronRight, Loader2, X } from "lucide-react";
import { usePatientsStore } from "@/store/patientsStore";
import { useAuthStore } from "@/store/authStore";

// ---- Register Patient Modal ----
function RegisterModal({ onClose }: { onClose: () => void }) {
  const { createPatient, loading } = usePatientsStore();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", dateOfBirth: "",
    gender: "unknown", bloodType: "", primaryPhone: "", primaryEmail: "",
  });
  const [err, setErr] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const patient = await createPatient(form);
    if (patient) {
      onClose();
      router.push(`/patients/${patient.id}`);
    } else {
      setErr(usePatientsStore.getState().error ?? "Registration failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="glass card"
        style={{ borderRadius: 14, width: 520, maxHeight: "90vh", overflowY: "auto", padding: 28 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#eeeae0" }}>Register New Patient</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>First Name *</label>
              <input required className="input mt-1 w-full" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Last Name *</label>
              <input required className="input mt-1 w-full" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Date of Birth *</label>
              <input required type="date" className="input mt-1 w-full" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Gender</label>
              <select className="input mt-1 w-full" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="unknown">Unknown</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Blood Type</label>
              <select className="input mt-1 w-full" value={form.bloodType} onChange={(e) => set("bloodType", e.target.value)}>
                <option value="">Unknown</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Phone</label>
              <input className="input mt-1 w-full" placeholder="+251 ..." value={form.primaryPhone} onChange={(e) => set("primaryPhone", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
            <input type="email" className="input mt-1 w-full" value={form.primaryEmail} onChange={(e) => set("primaryEmail", e.target.value)} />
          </div>

          {err && <div className="text-red-400 text-xs">{err}</div>}

          <div className="flex items-center gap-3 pt-2">
            <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex items-center gap-2" style={{ fontSize: 13 }} disabled={loading}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Register Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Patients List Page ----
export default function PatientsPage() {
  const router = useRouter();
  const { patients, loading, error, fetchPatients, total, currentPage, totalPages } = usePatientsStore();
  const { user, profile } = useAuthStore();
  const isDoctor = user?.roles?.includes("doctor") || profile?.roles?.some(r => r.name === "doctor");
  const isNurse = user?.roles?.includes("nurse") || profile?.roles?.some(r => r.name === "nurse");
  const restrictReg = isDoctor || isNurse;
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPatients(val, 1), 400);
  };

  return (
    <>
      {showModal && <RegisterModal onClose={() => setShowModal(false)} />}
      <Topbar title="Patients" />
      <main className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#93a096" }} />
              <input
                className="input pl-8 text-[13px]"
                placeholder="Search by name, MRN, phone…"
                style={{ width: 280 }}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: 12, color: "#93a096" }}>{total} patients</span>
          </div>
          {!restrictReg && (
            <button
              className="btn-primary flex items-center gap-2"
              style={{ padding: "10px 20px", fontSize: 13 }}
              onClick={() => setShowModal(true)}
            >
              <Plus size={14} /> Register Patient
            </button>
          )}
        </div>

        {error && <div className="text-red-400 text-sm mb-4">Error: {error}</div>}

        <div className="glass-shell card glass relative" style={{ borderRadius: 12, padding: 0, minHeight: 400 }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-xl">
              <Loader2 className="animate-spin text-[#9fd8bd]" size={24} />
            </div>
          )}
          <table className="data-table">
            <thead>
              <tr>
                <th>MRN</th><th>Name</th><th>Age</th><th>Blood</th><th>Phone</th><th>Allergies</th><th></th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10" style={{ color: "#93a096", fontSize: 13 }}>
                    {search ? `No patients matching "${search}"` : "No patients registered yet."}
                  </td>
                </tr>
              )}
              {patients.map((p) => {
                const ageYears = Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
                return (
                  <tr
                    key={p.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/patients/${p.id}`)}
                  >
                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "#93a096" }}>{p.mrn}</td>
                    <td style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                    <td style={{ color: "#93a096" }}>{ageYears}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontFamily: "monospace" }}>{p.bloodType ?? "?"}</span>
                    </td>
                    <td style={{ color: "#93a096", fontSize: 12 }}>{p.primaryPhone ?? "—"}</td>
                    <td>
                      {p.allergies?.length > 0 ? (
                        <span className="badge badge-red">{p.allergies.length} allerg{p.allergies.length > 1 ? "ies" : "y"}</span>
                      ) : (
                        <span style={{ color: "#93a096", fontSize: 11 }}>None</span>
                      )}
                    </td>
                    <td><ChevronRight size={14} style={{ color: "#9fd8bd" }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4" style={{ borderTop: "1px solid rgba(238,234,224,0.06)" }}>
              <span style={{ fontSize: 12, color: "#93a096" }}>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: "5px 14px" }}
                  disabled={currentPage <= 1}
                  onClick={() => fetchPatients(search, currentPage - 1)}
                >Prev</button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: "5px 14px" }}
                  disabled={currentPage >= totalPages}
                  onClick={() => fetchPatients(search, currentPage + 1)}
                >Next</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
