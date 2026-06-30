"use client";
import { useEffect } from "react";
import Topbar from "@/components/Topbar";
import { Users, CalendarDays, BedDouble, AlertTriangle, TrendingUp, Clock, ArrowUpRight, Loader2 } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
  const { metrics, loading, fetchMetrics } = useDashboardStore();
  const { user, profile } = useAuthStore();
  const isDoctor = user?.roles?.includes("doctor") || profile?.roles?.some(r => r.name === "doctor");
  const isNurse = user?.roles?.includes("nurse") || profile?.roles?.some(r => r.name === "nurse");
  const restrictStatsAndReg = isDoctor || isNurse;

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Fallback defaults if metrics aren't loaded yet
  const stats = [
    {
      icon: Users,
      label: "Active Wait Queue",
      value: metrics ? `${metrics.waitingCount} pts` : "—",
      delta: metrics ? `+${metrics.checkedInCount} processing` : "",
      color: "var(--color-primary)"
    },
    {
      icon: CalendarDays,
      label: "Appointments Today",
      value: metrics ? String(metrics.appointmentsCount) : "—",
      delta: "Scheduled",
      color: "var(--color-tertiary)"
    },
    {
      icon: BedDouble,
      label: "Ward Bed Occupancy",
      value: metrics ? `${metrics.bedOccupancy}%` : "—",
      delta: metrics ? `${metrics.occupiedBedsCount}/${metrics.totalBedsCount}` : "",
      color: "var(--color-secondary)"
    },
    {
      icon: AlertTriangle,
      label: "Critical Lab Alerts",
      value: metrics ? String(metrics.criticalLabResultsCount) : "—",
      delta: "Urgent Action",
      color: "#f87171"
    },
    // Only show Revenue to admin/owner, NOT to doctors/nurses
    ...(!restrictStatsAndReg ? [{
      icon: TrendingUp,
      label: "Revenue Today",
      value: metrics && typeof metrics.revenueToday === "number" ? `ETB ${metrics.revenueToday.toLocaleString()}` : "—",
      delta: "Live payments",
      color: "var(--color-primary)"
    }] : []),
    {
      icon: Clock,
      label: "Avg Wait Time",
      value: metrics ? `${metrics.averageWaitTime} min` : "—",
      delta: "Estimated",
      color: "var(--color-tertiary)"
    },
  ];

  const recentPatients = [
    { mrn: "MRN-00423", name: "Tigist Alemu",   age: 34, dept: "Cardiology",   status: "Admitted",    statusColor: "badge-green" },
    { mrn: "MRN-00424", name: "Bekele Worku",   age: 58, dept: "Emergency",     status: "Critical",   statusColor: "badge-red" },
    { mrn: "MRN-00425", name: "Meron Haile",    age: 27, dept: "Obstetrics",   status: "In Labor",   statusColor: "badge-amber" },
    { mrn: "MRN-00426", name: "Samuel Girma",   age: 45, dept: "Orthopedics",  status: "Post-Op",    statusColor: "badge-blue" },
    { mrn: "MRN-00427", name: "Hana Tesfaye",   age: 22, dept: "Pediatrics",   status: "Discharged", statusColor: "badge-neutral" },
  ];

  const alerts = [
    { type: "Critical Lab",   msg: "K+ 6.8 mEq/L — Bekele Worku",       time: "2 min ago",  color: "#f87171" },
    { type: "Bed Alert",      msg: "ICU capacity at 95%",                  time: "14 min ago", color: "var(--color-secondary)" },
    { type: "Drug Interaction",msg: "Warfarin + Aspirin — Room 204",       time: "31 min ago", color: "var(--color-secondary)" },
  ];

  return (
    <>
      <Topbar title="Hospital Overview Dashboard" />
      <main className="p-6 space-y-6">

        {loading && !metrics && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="animate-spin text-[var(--color-primary)]" size={14} />
            Refreshing real-time dashboard metrics...
          </div>
        )}

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
          {stats.map(({ icon: Icon, label, value, delta, color }) => (
            <div key={label} className="glass-shell card glass p-4 flex flex-col justify-between" style={{ borderRadius: 12 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(159,216,189,0.06)", border: `1px solid var(--color-border)` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="text-[10px] font-bold" style={{ color }}>{delta}</div>
              </div>
              <div className="stat-number mt-2 text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>{value}</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent patients */}
          <div className="col-span-2 glass-shell card glass p-5" style={{ borderRadius: 12 }}>
            <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-2.5">
              <h2 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Recent Admitted Patients</h2>
              <a href="/patients" className="text-xs hover:underline flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                View all <ArrowUpRight size={12} />
              </a>
            </div>
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>MRN</th><th>Name</th><th>Age</th><th>Department</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map(p => (
                  <tr key={p.mrn}>
                    <td style={{ color: "var(--color-text-muted)", fontFamily: "monospace", fontSize: 11 }}>{p.mrn}</td>
                    <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{p.name}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>{p.age}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>{p.dept}</td>
                    <td><span className={`badge ${p.statusColor}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alerts */}
          <div className="glass-shell card glass p-5 flex flex-col justify-between" style={{ borderRadius: 12 }}>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
                <h2 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Critical Clinical Alerts</h2>
                <span className="badge badge-red">{metrics ? metrics.criticalLabResultsCount : 3} active</span>
              </div>
              <div className="space-y-3">
                {alerts.map((a, i) => (
                  <div key={i} className="p-3.5 rounded-xl border" style={{ background: "rgba(248,113,113,0.02)", borderColor: "var(--color-border)" }}>
                    <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: a.color }}>
                      {a.type}
                    </div>
                    <div className="text-xs mt-1 font-semibold leading-relaxed" style={{ color: "var(--color-text)" }}>{a.msg}</div>
                    <div className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>{a.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--color-text-muted)" }}>Quick Clinical Actions</div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  ...(!restrictStatsAndReg ? [["Register Patient", "/patients"]] : []),
                  ["New Appointment", "/appointments"],
                  ["Emergency Triage", "/emergency"]
                ].map(([label, href]) => (
                  <a key={label} href={href} className="flex items-center justify-between p-2.5 rounded-xl border transition-all hover:bg-white/5"
                    style={{ background: "rgba(159,216,189,0.03)", borderColor: "var(--color-border)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>{label}</span>
                    <ArrowUpRight size={12} style={{ color: "var(--color-primary)" }} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bed occupancy visual */}
        <div className="glass-shell card glass p-5 space-y-4" style={{ borderRadius: 12 }}>
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
            <h2 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Ward Bed Occupancy Metrics</h2>
            <span className="badge badge-amber">{metrics ? `${metrics.bedOccupancy}% Capacity` : "Loading..."}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { ward: "General Ward", occ: metrics ? Math.round(metrics.occupiedBedsCount * 0.5) : 28, total: metrics ? Math.round(metrics.totalBedsCount * 0.5) : 40, color: "var(--color-primary)" },
              { ward: "ICU Unit",     occ: metrics ? Math.round(metrics.occupiedBedsCount * 0.1) : 19, total: metrics ? Math.round(metrics.totalBedsCount * 0.1) : 20, color: "#f87171" },
              { ward: "Pediatrics",   occ: metrics ? Math.round(metrics.occupiedBedsCount * 0.15) : 22, total: metrics ? Math.round(metrics.totalBedsCount * 0.15) : 30, color: "var(--color-tertiary)" },
              { ward: "Maternity",    occ: metrics ? Math.round(metrics.occupiedBedsCount * 0.12) : 18, total: metrics ? Math.round(metrics.totalBedsCount * 0.12) : 25, color: "var(--color-secondary)" },
              { ward: "Surgery Ward", occ: metrics ? Math.round(metrics.occupiedBedsCount * 0.08) : 14, total: metrics ? Math.round(metrics.totalBedsCount * 0.08) : 20, color: "var(--color-primary)" },
              { ward: "Orthopedics",  occ: metrics ? Math.round(metrics.occupiedBedsCount * 0.05) : 11, total: metrics ? Math.round(metrics.totalBedsCount * 0.05) : 15, color: "var(--color-tertiary)" },
            ].map(({ ward, occ, total, color }) => (
              <div key={ward} className="p-3.5 rounded-xl border bg-white/5 space-y-2.5" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>{ward}</span>
                  <span className="font-mono text-[10px]" style={{ color: "var(--color-text-muted)" }}>{occ}/{total}</span>
                </div>
                <div style={{ height: 5, background: "rgba(27,38,32,0.06)", borderRadius: 999 }}>
                  <div style={{ height: 5, width: total > 0 ? `${(occ/total)*100}%` : "0%", background: color, borderRadius: 999, transition: "width 1s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
