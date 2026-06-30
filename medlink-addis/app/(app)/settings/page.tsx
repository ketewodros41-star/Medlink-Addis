"use client";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { useAuthStore } from "@/store/authStore";
import { useUsersStore } from "@/store/usersStore";
import { Shield, UserPlus, Users, Key, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { users, loading, error, fetchUsers, createUser } = useUsersStore();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "doctor",
  });
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [auditQuery, setAuditQuery] = useState("");

  const mockLogs = users.flatMap((staff, idx) => {
    const name = `${staff.firstName} ${staff.lastName}`;
    const rolesStr = staff.roles?.map(r => r.name).join(", ") || "staff";
    return [
      {
        id: `log-${idx}-1`,
        timestamp: new Date(Date.now() - idx * 3600000 - 450000).toISOString(),
        actor: name,
        role: rolesStr,
        action: "User Authentication",
        details: "Logged into MedLink terminal successfully",
        status: "Success",
        ip: `192.168.1.${10 + idx}`,
      },
      {
        id: `log-${idx}-2`,
        timestamp: new Date(Date.now() - idx * 3600000 - 1200000).toISOString(),
        actor: name,
        role: rolesStr,
        action: "HIPAA Patient Record Access",
        details: `Accessed clinical chart for patient MRN-0042${idx % 5 + 1}`,
        status: "Success",
        ip: `192.168.1.${10 + idx}`,
      },
      ...(rolesStr.includes("doctor") ? [
        {
          id: `log-${idx}-3`,
          timestamp: new Date(Date.now() - idx * 3600000 - 2400000).toISOString(),
          actor: name,
          role: rolesStr,
          action: "Clinical Record Signed",
          details: `Signed SOAP encounter notes for patient MRN-0042${idx % 5 + 1}`,
          status: "Success",
          ip: `192.168.1.${10 + idx}`,
        }
      ] : []),
      ...(rolesStr.includes("pharmacist") ? [
        {
          id: `log-${idx}-4`,
          timestamp: new Date(Date.now() - idx * 3600000 - 1800000).toISOString(),
          actor: name,
          role: rolesStr,
          action: "Medication Dispensed",
          details: "Dispensed Ceftriaxone, Qty: 10, batch matching Rx-40291",
          status: "Success",
          ip: `192.168.1.${10 + idx}`,
        }
      ] : [])
    ];
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const filteredLogs = mockLogs.filter(log => 
    log.actor.toLowerCase().includes(auditQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(auditQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(auditQuery.toLowerCase())
  );

  const isAdmin =
    user?.roles?.includes("hospital_admin") ||
    user?.roles?.includes("super_admin");

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    const success = await createUser({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      roles: [form.role],
    });
    if (success) {
      setSuccessMsg("Staff account created successfully!");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "doctor",
      });
      setShowAddForm(false);
    }
  };

  if (!isAdmin) {
    return (
      <>
        <Topbar title="Settings & Admin" />
        <main className="p-6">
          <div
            className="glass-shell card glass max-w-lg mx-auto mt-10 p-8 text-center"
            style={{ borderRadius: 12 }}
          >
            <Shield size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#eeeae0] mb-2">Access Restricted</h2>
            <p className="text-sm text-[#93a096] mb-4">
              Only Hospital Administrators or Owners have access to terminal settings and staff management.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Settings & Admin" />
      <main className="p-6 space-y-6">
        {/* Header Summary */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#eeeae0]">System Administration</h1>
            <p className="text-xs text-[#93a096] mt-1">
              Configure clinic workflows, manage credentials, and deploy access permissions.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
            style={{
              background: "#9fd8bd",
              color: "#070b09",
            }}
          >
            <UserPlus size={14} />
            Add Staff Member
          </button>
        </div>

        {/* Dynamic Alerts */}
        {successMsg && (
          <div
            className="p-3 rounded-lg flex items-center gap-2 text-[#9fd8bd] text-sm"
            style={{ background: "rgba(159,216,189,0.05)", border: "1px solid rgba(159,216,189,0.15)" }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div
            className="p-3 rounded-lg flex items-center gap-2 text-red-400 text-sm"
            style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)" }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab selection bar */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10" style={{ width: "max-content" }}>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "users" 
                ? "bg-[var(--color-primary)] text-[var(--color-bg)] font-bold shadow-sm" 
                : "text-[var(--color-text-muted)] hover:text-white"
            }`}
          >
            Staff Directory
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "audit" 
                ? "bg-[var(--color-primary)] text-[var(--color-bg)] font-bold shadow-sm" 
                : "text-[var(--color-text-muted)] hover:text-white"
            }`}
          >
            Security Audit Logs
          </button>
        </div>

        {/* Users tab view */}
        {activeTab === "users" && (
          <>
            {/* Create Staff Member Panel */}
            {showAddForm && (
              <div
                className="glass-shell card glass p-6 space-y-4 max-w-xl animate-in fade-in slide-in-from-top-4 duration-200"
                style={{ borderRadius: 12 }}
              >
                <h2 className="text-sm font-semibold text-[#eeeae0]">Create Staff Account</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-[#93a096] mb-1.5 uppercase tracking-wide">First Name</label>
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="w-full bg-[rgba(238,234,224,0.02)] border border-[rgba(238,234,224,0.08)] rounded-lg px-3 py-2 text-sm text-[#eeeae0] focus:outline-none focus:border-[#9fd8bd] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#93a096] mb-1.5 uppercase tracking-wide">Last Name</label>
                      <input
                        type="text"
                        required
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="w-full bg-[rgba(238,234,224,0.02)] border border-[rgba(238,234,224,0.08)] rounded-lg px-3 py-2 text-sm text-[#eeeae0] focus:outline-none focus:border-[#9fd8bd] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#93a096] mb-1.5 uppercase tracking-wide">Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-[rgba(238,234,224,0.02)] border border-[rgba(238,234,224,0.08)] rounded-lg px-3 py-2 text-sm text-[#eeeae0] focus:outline-none focus:border-[#9fd8bd] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#93a096] mb-1.5 uppercase tracking-wide">Secure Password</label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-[rgba(238,234,224,0.02)] border border-[rgba(238,234,224,0.08)] rounded-lg px-3 py-2 text-sm text-[#eeeae0] focus:outline-none focus:border-[#9fd8bd] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#93a096] mb-1.5 uppercase tracking-wide">Assign Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full bg-[#070b09] border border-[rgba(238,234,224,0.08)] rounded-lg px-3 py-2 text-sm text-[#eeeae0] focus:outline-none focus:border-[#9fd8bd] transition-colors"
                    >
                      <option value="doctor">Medical Doctor</option>
                      <option value="nurse">Intake Nurse</option>
                      <option value="receptionist">Appointment Setter / Receptionist</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="cashier">Cashier</option>
                      <option value="medical_director">Chief Medical Officer / Medical Director</option>
                      <option value="hospital_admin">Co-Administrator / Owner</option>
                    </select>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-[rgba(238,234,224,0.08)] rounded-lg text-xs font-semibold text-[#93a096] hover:bg-[rgba(238,234,224,0.02)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-[#070b09] transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: "#9fd8bd" }}
                    >
                      {loading ? "Registering..." : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Staff Members List */}
            <div className="glass-shell card glass" style={{ borderRadius: 12 }}>
              <div className="flex items-center gap-3 mb-4">
                <Users size={16} className="text-[#9fd8bd]" />
                <h2 className="text-sm font-semibold text-[#eeeae0]">System User Accounts</h2>
              </div>

              {loading && !users.length ? (
                <div className="text-center py-6 text-sm text-[#93a096]">Retrieving system users...</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Assigned Roles</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((staff) => (
                      <tr key={staff.id}>
                        <td style={{ fontWeight: 500 }}>
                          {staff.firstName} {staff.lastName}
                        </td>
                        <td style={{ color: "#93a096" }}>{staff.email}</td>
                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            {staff.roles?.map((r) => (
                              <span
                                key={r.name}
                                className="px-2 py-0.5 rounded text-[10px] font-medium"
                                style={{
                                  background: "rgba(159,216,189,0.08)",
                                  color: "#9fd8bd",
                                  border: "1px solid rgba(159,216,189,0.15)",
                                  textTransform: "capitalize",
                                }}
                              >
                                {r.name.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${staff.isActive ? "badge-green" : "badge-neutral"}`}>
                            {staff.isActive ? "Active" : "Suspended"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Audit Logs tab view */}
        {activeTab === "audit" && (
          <div className="glass-shell card glass space-y-4" style={{ borderRadius: 12 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-sky-400" />
                <h2 className="text-sm font-semibold text-[#eeeae0]">HIPAA Compliance Audit Logs</h2>
              </div>
              <input
                type="text"
                placeholder="Search audit trail by actor, action or logs..."
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
                className="bg-[rgba(238,234,224,0.02)] border border-[rgba(238,234,224,0.08)] rounded-lg px-3 py-1.5 text-xs text-[#eeeae0] focus:outline-none focus:border-[#9fd8bd] transition-colors w-72"
              />
            </div>

            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Access Level</th>
                  <th>Action Category</th>
                  <th>Event Log Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01]">
                    <td className="font-mono text-[#93a096] text-[10.5px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="font-semibold text-[#eeeae0]">{log.actor}</td>
                    <td>
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-white/5 border border-white/5 text-[#93a096] uppercase">
                        {log.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="font-semibold text-sky-400">{log.action}</td>
                    <td className="text-[var(--color-text-muted)]">{log.details}</td>
                    <td className="font-mono text-[#93a096] text-[10.5px]">{log.ip}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-[#93a096] italic">
                      No security events match the search filter query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
