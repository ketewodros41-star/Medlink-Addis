"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function KnowledgeBaseRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/clinical/knowledge-center");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-black/10">
      <Loader2 className="animate-spin text-[#9fd8bd]" size={30} />
    </div>
  );
}
