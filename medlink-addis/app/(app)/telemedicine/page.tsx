"use client";
import { useEffect, useState, useRef } from "react";
import Topbar from "@/components/Topbar";
import { Video, Mic, Phone, MessageSquare, FileText, Send, Monitor, Loader2, RefreshCw } from "lucide-react";
import { useTelemedicineStore } from "@/store/telemedicineStore";

export default function TelemedicinePage() {
  const { session, chatMessages, loading, error, fetchActiveSession, sendChatMessage, submitPrescription } = useTelemedicineStore();
  const [messageText, setMessageText] = useState("");
  const [drugName, setDrugName] = useState("");
  const [sig, setSig] = useState("");
  const [qty, setQty] = useState(1);
  const [rxSuccessMessage, setRxSuccessMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !session) return;
    await sendChatMessage(session.id, "doctor", messageText.trim());
    setMessageText("");
  };

  const handleSendPrescription = async () => {
    if (!drugName.trim() || !sig.trim() || !session) return;
    try {
      const res = await submitPrescription(
        session.id,
        session.patientId,
        drugName.trim(),
        sig.trim(),
        qty,
        "Dr. Dave (Telehealth)"
      );
      setRxSuccessMessage(`Sent Rx: ${res.rxNumber}`);
      setDrugName("");
      setSig("");
      setQty(1);
      setTimeout(() => setRxSuccessMessage(""), 5000);
    } catch (err) {
      setRxSuccessMessage("Failed to submit Rx");
    }
  };

  const getPatientAge = (dobString?: string) => {
    if (!dobString) return "N/A";
    const birthDate = new Date(dobString);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    return `${age} y/o`;
  };

  return (
    <>
      <Topbar title="Telemedicine" />
      <main className="p-6">
        {error && <div className="text-red-400 mb-4">Error loading session: {error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, height: "calc(100vh - 130px)" }}>

          {/* Video area */}
          <div className="glass-shell card glass flex flex-col relative" style={{ borderRadius: 14, padding: 0, overflow: "hidden" }}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-xl">
                <Loader2 className="animate-spin text-[#9fd8bd]" size={24} />
              </div>
            )}
            
            {/* Main video or Jitsi iframe */}
            <div style={{ flex: 1, background: "rgba(7,11,9,0.95)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {session?.roomUrl ? (
                <iframe
                  src={session.roomUrl}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold mx-auto mb-3 animate-pulse"
                    style={{ background: "rgba(159,216,189,0.15)", border: "2px solid rgba(159,216,189,0.3)", color: "#9fd8bd" }}>
                    {session?.patient ? `${session.patient.firstName[0]}${session.patient.lastName[0]}` : "TH"}
                  </div>
                  <div style={{ color: "#eeeae0", fontWeight: 600 }}>
                    {session?.patient ? `${session.patient.firstName} ${session.patient.lastName}` : "No Active Call"}
                  </div>
                  <div style={{ fontSize: 12, color: "#93a096", marginTop: 4 }}>
                    {session ? "Connected (Waiting for video feed...)" : "No telemedicine sessions are currently active."}
                  </div>
                </div>
              )}

              {/* Session timer */}
              {session && (
                <div style={{ position: "absolute", top: 16, left: 16 }}>
                  <span className="badge badge-green">
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: "#4ade80", marginRight: 6 }} />
                    Live Room
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: 16, borderTop: "1px solid rgba(238,234,224,0.06)" }}>
              {[
                { icon: Mic,          active: true,  label: "Mute" },
                { icon: Video,        active: true,  label: "Camera" },
                { icon: Monitor,      active: false, label: "Screen" },
                { icon: MessageSquare,active: true, label: "Chat" },
                { icon: RefreshCw,    active: true,  label: "Sync", action: fetchActiveSession },
              ].map(({ icon: Icon, active, label, action }) => (
                <button key={label} className="flex flex-col items-center gap-1" onClick={action}
                  style={{ background: "rgba(238,234,224,0.05)", border: "1px solid rgba(238,234,224,0.1)", borderRadius: 10, padding: "10px 16px", cursor: "pointer", color: active ? "#9fd8bd" : "#93a096" }}>
                  <Icon size={16} />
                  <span style={{ fontSize: 9 }}>{label}</span>
                </button>
              ))}
              <button style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, padding: "10px 24px", cursor: "pointer", color: "#f87171", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Phone size={16} />
                <span style={{ fontSize: 9 }}>End</span>
              </button>
            </div>
          </div>

          {/* Side panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
            {/* Patient info */}
            <div className="glass-shell card glass" style={{ borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#93a096", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Patient info</div>
              {session?.patient ? (
                <>
                  <div style={{ fontWeight: 600, color: "#eeeae0", marginBottom: 2 }}>
                    {session.patient.firstName} {session.patient.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: "#93a096", marginBottom: 10 }}>
                    {session.patient.mrn} &middot; {getPatientAge(session.patient.dateOfBirth)} &middot; {session.patient.bloodType || "O+"}
                  </div>
                  <div className="space-y-1.5">
                    {["BP: 128/82 mmHg (Wearable)", "HR: 94 bpm (Wearable)", "Allergies: None"].map(v => (
                      <div key={v} style={{ fontSize: 12, color: "#eeeae0", padding: "5px 8px", borderRadius: 5, background: "rgba(238,234,224,0.04)" }}>{v}</div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "#93a096" }}>No active patient connected.</div>
              )}
            </div>

            {/* Chat */}
            <div className="glass-shell card glass flex flex-col" style={{ borderRadius: 12, flex: 1, padding: 0, overflow: "hidden", minHeight: 250 }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(238,234,224,0.06)", fontSize: 12, fontWeight: 600, color: "#eeeae0" }}>Secure Consultation Chat</div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {chatMessages.map((msg, i) => (
                  <div key={msg.id || i} style={{ display: "flex", flexDirection: "column", alignItems: msg.senderType === "doctor" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: msg.senderType === "doctor" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      background: msg.senderType === "doctor" ? "rgba(159,216,189,0.12)" : "rgba(238,234,224,0.06)",
                      border: `1px solid ${msg.senderType === "doctor" ? "rgba(159,216,189,0.2)" : "rgba(238,234,224,0.08)"}`,
                      fontSize: 12, color: "#eeeae0", lineHeight: 1.45 }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: 9.5, color: "#93a096", marginTop: 3 }}>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(238,234,224,0.06)", display: "flex", gap: 8 }}>
                <input className="input" style={{ flex: 1, fontSize: 12, padding: "8px 12px" }}
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                />
                <button onClick={handleSendMessage} style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(159,216,189,0.15)", border: "1px solid rgba(159,216,189,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Send size={13} color="#9fd8bd" />
                </button>
              </div>
            </div>

            {/* Prescription pad */}
            <div className="glass-shell card glass" style={{ borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#93a096", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Post-Consultation Rx</div>
              <input className="input mb-2 text-[12px]" placeholder="Drug name..." value={drugName} onChange={e => setDrugName(e.target.value)} />
              <input className="input mb-2 text-[12px]" placeholder="Dosage instructions (Sig)..." value={sig} onChange={e => setSig(e.target.value)} />
              <div className="flex gap-2 mb-3">
                <input className="input text-[12px]" style={{ width: 80 }} type="number" min={1} placeholder="Qty" value={qty} onChange={e => setQty(Number(e.target.value))} />
                {rxSuccessMessage && <span className="text-[11px] text-[#9fd8bd] self-center animate-fade-in">{rxSuccessMessage}</span>}
              </div>
              <button onClick={handleSendPrescription} className="btn-primary w-full" style={{ fontSize: 12, padding: "9px" }}>Send to Pharmacy</button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
