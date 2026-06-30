"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, Mail, Building, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import ClientWebGLBackground from "@/components/ClientWebGLBackground";

export default function LoginPage() {
  const { hospitals, loading, error, fetchHospitals, login, accessToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  useEffect(() => {
    if (accessToken) {
      router.push("/dashboard");
    }
  }, [accessToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !hospitalId) return;
    const ok = await login(email, password, hospitalId);
    if (ok) {
      router.push("/dashboard");
    }
  };

  return (
    <div style={{ background: "#070b09", minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <ClientWebGLBackground />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 55%, rgba(159,216,189,0.06) 0%, transparent 60%)" }} />

      <div className="relative z-10 w-full max-w-[420px] px-6">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(159,216,189,0.15)", border: "1px solid rgba(159,216,189,0.3)" }}>
            <Activity size={22} color="#9fd8bd" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#eeeae0", fontFamily: "var(--font-display)" }}>
            Welcome back
          </h1>
          <p className="text-sm mt-2" style={{ color: "#93a096" }}>
            Sign in to access your MedLink Addis terminal
          </p>
        </div>

        <div className="glass-shell card glass" style={{ borderRadius: 16, padding: "30px 24px" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Hospital Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "#93a096" }}>
                Hospital Node
              </label>
              <div className="relative">
                <select 
                  className="input w-full pl-9 pr-4 py-2.5 text-sm appearance-none cursor-pointer"
                  style={{ background: "rgba(7,11,9,0.5)", color: "#eeeae0" }}
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  required
                >
                  <option value="" disabled style={{ background: "#070b09" }}>Select Hospital Node...</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id} style={{ background: "#070b09" }}>{h.name}</option>
                  ))}
                </select>
                <Building size={14} className="absolute left-3 top-3.5 text-[#93a096]" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "#93a096" }}>
                Identity Email
              </label>
              <div className="relative">
                <input 
                  type="email"
                  className="input w-full pl-9 text-sm"
                  placeholder="identity@medlink.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={14} className="absolute left-3 top-3.5 text-[#93a096]" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "#93a096" }}>
                Secure Password
              </label>
              <div className="relative">
                <input 
                  type="password"
                  className="input w-full pl-9 text-sm"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={14} className="absolute left-3 top-3.5 text-[#93a096]" />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 mt-2 animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-6 flex items-center justify-center gap-2"
              style={{ fontSize: 13 }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Authenticating...
                </>
              ) : (
                "Authenticate Terminal"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
