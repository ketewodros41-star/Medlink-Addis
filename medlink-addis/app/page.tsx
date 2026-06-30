import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Zap, Brain, Globe, Activity, CheckCircle } from "lucide-react";
import ClientWebGLBackground from "@/components/ClientWebGLBackground";

const features = [
  { icon: Activity,    title: "Full EMR",          desc: "Complete electronic medical records with ICD-10, vitals, SOAP notes, and global patient timeline." },
  { icon: Brain,       title: "AI Clinical Suite", desc: "Medical scribe, drug interaction checking, risk prediction, and clinical summaries powered by LLMs." },
  { icon: Zap,         title: "Real-time Ops",     desc: "Live bed occupancy, emergency triage queue, lab result alerts, and ambulance dispatch via WebSocket." },
  { icon: Shield,      title: "HIPAA-Ready",       desc: "Full audit logs, RBAC permissions, PHI encryption, and FHIR R4 compliance built in from day one." },
  { icon: Globe,       title: "FHIR R4 & HL7",     desc: "Native interoperability with lab analyzers, PACS systems, NHIF claims, and external health networks." },
  { icon: CheckCircle, title: "End-to-End Billing", desc: "Charge capture, insurance claims, payment gateways (Telebirr, CBE Birr, Chapa), installment plans." },
];

const stats = [
  { value: "23+",   label: "Hospital Modules" },
  { value: "10x",   label: "Faster Documentation" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "FHIR",  label: "R4 Compliant" },
];

export default function LandingPage() {
  return (
    <div style={{ background: "#070b09", minHeight: "100vh", overflowX: "hidden" }}>
      <ClientWebGLBackground />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 0%, rgba(159,216,189,0.04) 0%, transparent 70%)" }} />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5"
        style={{ borderBottom: "1px solid rgba(238,234,224,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(159,216,189,0.15)", border: "1px solid rgba(159,216,189,0.3)" }}>
            <Activity size={13} color="#9fd8bd" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "#eeeae0", fontFamily: "var(--font-display)" }}>
            MedLink Addis
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-[13px]" style={{ color: "#93a096" }}>Features</Link>
          <Link href="#doctors" className="text-[13px]" style={{ color: "#93a096" }}>Team</Link>
          <Link href="/dashboard" className="btn-primary" style={{ padding: "9px 22px", fontSize: 13 }}>
            Enter Platform
          </Link>
        </div>
      </nav>

      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-32 pb-24">
        <div className="badge badge-green mb-8">
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: "#4ade80", marginRight: 8 }} />
          Now in production across Addis Ababa
        </div>
        <h1 className="display-lg max-w-4xl" style={{ color: "#eeeae0" }}>
          The Complete
          <br /><span style={{ color: "#9fd8bd" }}>Hospital OS</span>
          <br />for Ethiopia
        </h1>
        <p className="mt-8 max-w-xl text-[15px] leading-relaxed" style={{ color: "#93a096" }}>
          MedLink Addis unifies EMR, ERP, lab, pharmacy, billing, telemedicine, and AI into one
          enterprise-grade platform built specifically for Ethiopian healthcare.
        </p>
        <div className="flex items-center gap-4 mt-10">
          <Link href="/dashboard" className="btn-primary">Open Dashboard <ArrowRight size={15} /></Link>
          <Link href="#features" className="btn-secondary">See Features</Link>
        </div>
        <div className="grid grid-cols-4 gap-8 mt-20 w-full max-w-2xl">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="stat-number">{value}</div>
              <div style={{ color: "#93a096", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-8 mb-24">
        <div className="glass-shell max-w-5xl mx-auto" style={{ borderRadius: 16, overflow: "hidden" }}>
          <div className="glass relative" style={{ height: 400, borderRadius: 16 }}>
            <Image
              src="/assets/hospital/High-end_Architectural_Minimalism_hero_shot_202606291226.jpeg"
              alt="Hospital"
              fill
              className="object-cover"
              style={{ opacity: 0.55 }}
              priority
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 35%, #070b09 100%)" }} />
            <div style={{ position: "absolute", bottom: 32, left: 40 }}>
              <div className="badge badge-green mb-3">Live Preview</div>
              <h2 className="display-md" style={{ color: "#eeeae0", maxWidth: 480 }}>Built for clinical excellence</h2>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 px-8 pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="badge badge-amber mb-4">Platform Capabilities</div>
            <h2 className="display-md" style={{ color: "#eeeae0" }}>Everything a hospital needs</h2>
            <p className="mt-4 text-[14px]" style={{ color: "#93a096" }}>23 fully integrated modules. One platform.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-shell card glass" style={{ borderRadius: 12 }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "rgba(159,216,189,0.10)", border: "1px solid rgba(159,216,189,0.2)" }}>
                  <Icon size={16} color="#9fd8bd" />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#eeeae0", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 12.5, color: "#93a096", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="doctors" className="relative z-10 px-8 pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="badge badge-blue mb-4">Our Specialists</div>
            <h2 className="display-md" style={{ color: "#eeeae0" }}>Trusted by leading clinicians</h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { src: "/assets/doctors/Female_doctor_wearing_mask_202606291225.jpeg", name: "Dr. Selamawit Hailu", role: "Chief of Medicine" },
              { src: "/assets/doctors/Male_doctor_wearing_mask_202606291225.jpeg",   name: "Dr. Yonas Tesfaye",  role: "Emergency Medicine" },
              { src: "/assets/doctors/Veteran_doctor_wearing_mask_202606291225.jpeg",name: "Dr. Habtamu Bekele", role: "Head of Surgery" },
            ].map(({ src, name, role }) => (
              <div key={name} className="glass-shell relative overflow-hidden" style={{ borderRadius: 12, aspectRatio: "3/4" }}>
                <Image src={src} alt={name} fill className="object-cover" style={{ opacity: 0.8 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,11,9,0.9) 0%, transparent 55%)" }} />
                <div style={{ position: "absolute", bottom: 20, left: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#eeeae0" }}>{name}</div>
                  <div style={{ fontSize: 11, marginTop: 2, color: "#9fd8bd" }}>{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-8 pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="glass-shell glass flex flex-col md:flex-row items-center justify-between gap-8 px-10 py-12" style={{ borderRadius: 16 }}>
            <div>
              <h2 className="display-md" style={{ color: "#eeeae0", maxWidth: 400 }}>Ready to transform your hospital?</h2>
              <p style={{ marginTop: 12, fontSize: 14, color: "#93a096" }}>Get up and running in under 6 weeks.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="btn-primary">Open Dashboard <ArrowRight size={14} /></Link>
              <Link href="#" className="btn-secondary">Request Demo</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-8 py-10" style={{ borderTop: "1px solid rgba(238,234,224,0.06)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={13} color="#9fd8bd" />
            <span style={{ fontSize: 12, color: "#93a096" }}>MedLink Addis © 2026</span>
          </div>
          <div className="flex gap-6">
            {["Privacy", "Security", "Compliance", "API Docs"].map(l => (
              <Link key={l} href="#" style={{ fontSize: 12, color: "#93a096" }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
