import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedLink Addis — Hospital Operating System",
  description: "Enterprise EMR, ERP, and AI-powered clinical platform for Ethiopian hospitals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
