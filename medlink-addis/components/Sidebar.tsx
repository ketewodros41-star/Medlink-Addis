"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  FlaskConical, Pill, Receipt, Siren, Video,
  Settings, Activity, ChevronRight, BedDouble, BookOpen
} from "lucide-react";

const navItems = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { href: "/patients",     icon: Users,           label: "Patients" },
  { href: "/appointments", icon: CalendarDays,    label: "Appointments" },
  { href: "/clinical",     icon: Stethoscope,     label: "Clinical" },
  { href: "/clinical/knowledge-center", icon: BookOpen, label: "Knowledge Center" },
  { href: "/laboratory",   icon: FlaskConical,    label: "Laboratory" },
  { href: "/pharmacy",     icon: Pill,            label: "Pharmacy" },
  { href: "/billing",      icon: Receipt,         label: "Billing" },
  { href: "/admissions",   icon: BedDouble,       label: "Admissions" },
  { href: "/emergency",    icon: Siren,           label: "Emergency", alert: true },
  { href: "/telemedicine", icon: Video,           label: "Telemedicine" },
];


export default function Sidebar() {
  const pathname = usePathname();
  const { user, profile } = useAuthStore();

  const isDoctor = user?.roles?.includes("doctor") || profile?.roles?.some(r => r.name === "doctor");
  const isNurse = user?.roles?.includes("nurse") || profile?.roles?.some(r => r.name === "nurse");
  const hideBilling = isDoctor || isNurse;

  const filteredNavItems = navItems.filter(item => {
    if (item.href === "/billing" && hideBilling) return false;
    return true;
  });

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[220px] z-40 flex flex-col"
      style={{
        background: "var(--glass-bg, rgba(7,11,9,0.88))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: "1px solid rgba(238,234,224,0.07)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(159,216,189,0.12)", border: "1px solid rgba(159,216,189,0.25)" }}>
          <Activity size={15} color="#9fd8bd" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-none" style={{ color: "#eeeae0", fontFamily: "var(--font-display)" }}>MedLink</div>
          <div className="text-[11px] mt-0.5" style={{ color: "#93a096" }}>Addis</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {filteredNavItems.map(({ href, icon: Icon, label, alert }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className="block">
              <div
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[14.5px] font-medium transition-all duration-150 hover:bg-white/5"
                style={{
                  color: active ? "var(--color-primary)" : "var(--color-text-muted)",
                  background: active ? "rgba(45,106,79,0.08)" : "transparent",
                  border: active ? "1px solid var(--color-border)" : "1px solid transparent",
                }}
              >
                <Icon size={17} />
                <span>{label}</span>
                {active && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />}
                {alert && !active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400 glow-pulse" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2.5 pb-4" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px" }}>
        <Link href="/settings" className="block">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors hover:bg-white/5"
            style={{ color: "var(--color-text-muted)" }}>
            <Settings size={15} />
            <span>Settings</span>
          </div>
        </Link>
        {/* User */}
        <UserSection />
      </div>
    </aside>
  );
}

function UserSection() {
  const { profile } = useAuthStore();
  
  if (!profile) {
    return (
      <div className="flex items-center gap-3 mt-3 px-3.5 py-3 rounded-xl glass"
        style={{ borderColor: "var(--color-border)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold animate-pulse"
          style={{ background: "rgba(159,216,189,0.1)", color: "var(--color-primary)" }}>
          ..
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate text-[var(--color-text-muted)]">Loading user...</div>
        </div>
      </div>
    );
  }

  const initials = ((profile.firstName?.[0] || "") + (profile.lastName?.[0] || "")).toUpperCase();
  const displayName = `${profile.firstName} ${profile.lastName}`;
  const rolesText = profile.roles?.map(r => r.name.replace("_", " ")).join(", ") || "Staff";

  return (
    <div className="flex items-center gap-3 mt-3 px-3.5 py-3 rounded-xl glass"
      style={{ borderColor: "var(--color-border)" }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: "var(--color-primary)", color: "var(--color-bg)", textTransform: "uppercase" }}>
        {initials || "U"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold truncate" style={{ color: "var(--color-text)" }}>
          {displayName}
        </div>
        <div className="text-[11px] truncate text-[var(--color-text-muted)]" style={{ textTransform: "capitalize" }}>
          {rolesText}
        </div>
      </div>
    </div>
  );
}
