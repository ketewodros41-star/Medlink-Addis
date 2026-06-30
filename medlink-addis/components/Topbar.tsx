"use client";
import { useEffect, useState } from "react";
import { Bell, Search, Sun, Moon } from "lucide-react";

export default function Topbar({ title }: { title: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light") || document.documentElement.getAttribute("data-theme") === "light";
    setTheme(isLight ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      setTheme("dark");
    }
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center gap-4 px-6"
      style={{
        left: "220px",
        height: "60px",
        background: "var(--glass-bg, rgba(7,11,9,0.80))",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <h1
        className="text-sm font-semibold flex-1"
        style={{ color: "var(--color-text)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
      >
        {title}
      </h1>
      <div className="relative">
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
        <input
          type="text"
          placeholder="Search patients, labs…"
          className="input text-[12.5px] pl-8 py-2"
          style={{ width: 220 }}
        />
      </div>
      <button 
        onClick={toggleTheme}
        className="w-8 h-8 flex items-center justify-center rounded-lg glass btn-ghost text-xs"
        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      >
        {theme === "dark" ? <Sun size={14} className="text-[#e2a356]" /> : <Moon size={14} className="text-[#0284c7]" />}
      </button>
      <button className="relative w-8 h-8 flex items-center justify-center rounded-lg glass btn-ghost">
        <Bell size={14} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400" />
      </button>
    </header>
  );
}
