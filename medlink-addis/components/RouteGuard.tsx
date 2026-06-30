"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { accessToken, initialize } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check local storage and restore session
    initialize();
  }, [initialize]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token && !accessToken) {
      setAuthorized(false);
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [accessToken, router]);

  if (!authorized) {
    return (
      <div style={{ background: "#070b09", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-[#9fd8bd] mx-auto" size={24} />
          <p style={{ color: "#93a096", fontSize: 13 }}>Verifying terminal credentials...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
