"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Topbar from "@/components/Topbar";
import { Plus, ChevronLeft, ChevronRight, Video, MapPin, Loader2, X, Search, Calendar, Clock, User, FileText } from "lucide-react";
import { useAppointmentsStore } from "@/store/appointmentsStore";
import { usePatientsStore } from "@/store/patientsStore";
import { useUsersStore } from "@/store/usersStore";
import { parseISO, getDay, getHours, format } from "date-fns";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dates = [30, 1, 2, 3, 4, 5, 6];
const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

// ---- Booking Modal Component ----
interface BookModalProps {
  onClose: () => void;
}

function BookModal({ onClose }: BookModalProps) {
  const { createAppointment, loading: bookingLoading } = useAppointmentsStore();
  const { patients, fetchPatients, loading: patientsLoading } = usePatientsStore();
  const { users, fetchUsers, loading: usersLoading } = useUsersStore();

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("08:00");
  const [duration, setDuration] = useState("30");
  const [type, setType] = useState("General Checkup");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const debounceRef = useRef<any>(null);

  // Initial loads
  useEffect(() => {
    fetchPatients("", 1);
    fetchUsers();
  }, [fetchPatients, fetchUsers]);

  // Debounced patient search
  const handlePatientSearchChange = (val: string) => {
    setPatientSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPatients(val, 1), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!selectedPatientId) {
      setErr("Please select a patient.");
      return;
    }
    if (!selectedDoctorId) {
      setErr("Please select a doctor.");
      return;
    }
    if (!dateStr) {
      setErr("Please select a date.");
      return;
    }

    const scheduledTime = `${dateStr}T${timeStr}:00`;
    const payload = {
      patientId: selectedPatientId,
      doctorId: selectedDoctorId,
      scheduledTime,
      durationMinutes: parseInt(duration),
      type,
      notes: notes.trim() || undefined,
    };

    const ok = await createAppointment(payload);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErr(useAppointmentsStore.getState().error ?? "Failed to book appointment.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="glass card"
        style={{ borderRadius: 14, width: 550, maxHeight: "90vh", overflowY: "auto", padding: 28 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#eeeae0" }}>Book New Appointment</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#9fd8bd]/20 flex items-center justify-center mx-auto text-[#9fd8bd]">
              <Plus size={24} className="rotate-45" />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#eeeae0" }}>Appointment Booked!</h3>
            <p style={{ fontSize: 12.5, color: "#93a096" }}>The slot has been scheduled successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Search & Select */}
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Patient *</label>
              <div className="relative mb-2">
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#93a096" }} />
                <input
                  className="input pl-8 text-[12.5px] w-full"
                  placeholder="Type name or MRN to filter..."
                  value={patientSearch}
                  onChange={(e) => handlePatientSearchChange(e.target.value)}
                />
              </div>
              <select
                required
                className="input w-full text-[13px]"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                size={patients.length > 0 ? Math.min(patients.length, 4) : 1}
                style={{ height: "auto", maxHeight: 110 }}
              >
                <option value="" disabled>Select patient from search results...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.mrn})
                  </option>
                ))}
              </select>
              {patientsLoading && <div style={{ fontSize: 11, color: "#93a096", marginTop: 4 }}>Loading search results...</div>}
            </div>

            {/* Doctor Select */}
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Doctor *</label>
              <select
                required
                className="input w-full text-[13px]"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                <option value="" disabled>Select practitioner...</option>
                {users
                  .filter((u) => u.isActive && u.roles.some((r) => r.name.toLowerCase().includes("doctor") || r.name.toLowerCase().includes("admin")))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      Dr. {u.firstName} {u.lastName} ({u.roles.map((r) => r.name).join(", ")})
                    </option>
                  ))}
              </select>
              {usersLoading && <div style={{ fontSize: 11, color: "#93a096", marginTop: 4 }}>Loading doctors...</div>}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Date *</label>
                <input
                  required
                  type="date"
                  className="input w-full"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Time *</label>
                <select
                  required
                  className="input w-full"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Type</label>
                <select
                  className="input w-full"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="General Checkup">General Checkup</option>
                  <option value="Cardiology Consultation">Cardiology Consultation</option>
                  <option value="Pediatrics Consultation">Pediatrics Consultation</option>
                  <option value="Telemedicine consultation">Telemedicine consultation</option>
                  <option value="Post-Op Follow-up">Post-Op Follow-up</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Duration</label>
                <select
                  className="input w-full"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea
                className="input w-full"
                rows={2}
                placeholder="Reason for visit, symptoms noted..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {err && <div className="text-red-400 text-xs">{err}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                style={{ fontSize: 13 }}
                disabled={bookingLoading}
              >
                {bookingLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Confirm Booking
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---- Main Page Component ----
export default function AppointmentsPage() {
  const { appointments, loading, error, fetchAppointments } = useAppointmentsStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Helper to map real appointments to grid coordinates
  const mappedAppts = appointments.map((appt) => {
    const date = parseISO(appt.scheduledTime);
    // getDay returns 0-6 (Sun-Sat). Our grid is Mon-Sun (0-6 index)
    const rawDay = getDay(date);
    const gridDay = rawDay === 0 ? 6 : rawDay - 1; 

    // getHours returns 0-23. Grid starts at 8AM (index 0)
    const hour = getHours(date);
    const gridHour = hour - 8;

    return {
      day: gridDay,
      hour: gridHour,
      patient: "Patient ID: " + appt.patientId.slice(0, 4),
      type: appt.type,
      duration: Math.ceil(appt.durationMinutes / 60),
      mode: appt.type.toLowerCase().includes('telemedicine') ? "telemedicine" : "in-person",
      color: appt.type.toLowerCase().includes('telemedicine') ? "#a3d1df" : "#9fd8bd"
    };
  });

  return (
    <>
      {showModal && <BookModal onClose={() => setShowModal(false)} />}
      <Topbar title="Appointments" />
      <main className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button className="btn-ghost"><ChevronLeft size={15} /></button>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#eeeae0" }}>June 30 &mdash; July 6, 2026</span>
            <button className="btn-ghost"><ChevronRight size={15} /></button>
          </div>
          <div className="flex items-center gap-2">
            {["Day", "Week", "Month"].map(v => (
              <button key={v} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 999, background: v === "Week" ? "rgba(159,216,189,0.10)" : "transparent", border: v === "Week" ? "1px solid rgba(159,216,189,0.25)" : "1px solid rgba(238,234,224,0.08)", color: v === "Week" ? "#9fd8bd" : "#93a096", cursor: "pointer" }}>{v}</button>
            ))}
            <button
              className="btn-primary flex items-center gap-2"
              style={{ padding: "9px 18px", fontSize: 13 }}
              onClick={() => setShowModal(true)}
            >
              <Plus size={13} /> Book
            </button>
          </div>
        </div>

        {error && <div className="text-red-400 text-sm mb-4">Failed to load schedule: {error}</div>}

        <div className="glass-shell card glass relative" style={{ borderRadius: 12, padding: 0, overflow: "hidden" }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
              <Loader2 className="animate-spin text-[#9fd8bd]" size={24} />
            </div>
          )}

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: "1px solid rgba(238,234,224,0.06)" }}>
            <div />
            {days.map((d, i) => (
              <div key={d} style={{ padding: "12px 8px", textAlign: "center", borderLeft: "1px solid rgba(238,234,224,0.05)" }}>
                <div style={{ fontSize: 10, color: "#93a096", textTransform: "uppercase", letterSpacing: "0.08em" }}>{d}</div>
                <div style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 300, color: i === 2 ? "#9fd8bd" : "#eeeae0", marginTop: 2 }}>{dates[i]}</div>
              </div>
            ))}
          </div>
          {/* Time rows */}
          <div style={{ overflowY: "auto", maxHeight: 520 }}>
            {hours.map((h, hi) => (
              <div key={h} style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: "1px solid rgba(238,234,224,0.04)", minHeight: 64, position: "relative" }}>
                <div style={{ padding: "8px 8px 0", fontSize: 10, color: "#93a096", textAlign: "right" }}>{h}</div>
                {days.map((_, di) => {
                  const appt = mappedAppts.find(a => a.day === di && a.hour === hi);
                  return (
                    <div key={di} style={{ borderLeft: "1px solid rgba(238,234,224,0.04)", padding: 4, position: "relative" }}>
                      {appt && (
                        <div style={{ background: `${appt.color}15`, border: `1px solid ${appt.color}30`, borderRadius: 6, padding: "6px 8px", height: appt.duration > 1 ? "130px" : "52px", overflow: "hidden" }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: appt.color }}>{appt.type}</div>
                          <div style={{ fontSize: 10.5, color: "#eeeae0", marginTop: 2 }}>{appt.patient}</div>
                          <div style={{ marginTop: 4 }}>
                            {appt.mode === "telemedicine"
                              ? <span style={{ fontSize: 9, color: "#a3d1df", display: "flex", alignItems: "center", gap: 2 }}><Video size={8} />Telemedicine</span>
                              : <span style={{ fontSize: 9, color: "#93a096", display: "flex", alignItems: "center", gap: 2 }}><MapPin size={8} />In-person</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
