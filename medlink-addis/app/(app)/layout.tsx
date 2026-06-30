import Sidebar from "@/components/Sidebar";
import RouteGuard from "@/components/RouteGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", paddingTop: 60 }}>
          {children}
        </div>
      </div>
    </RouteGuard>
  );
}
