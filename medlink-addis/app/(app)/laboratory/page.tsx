"use client";
import { useEffect, useState, useRef } from "react";
import Topbar from "@/components/Topbar";
import { AlertTriangle, CheckCircle, Clock, Plus, Search, Loader2, X, FileText, Trash2, Paperclip } from "lucide-react";
import { useLaboratoryStore, LabOrder } from "@/store/laboratoryStore";
import { usePatientsStore } from "@/store/patientsStore";

function StatusIcon({ status }: { status: string }) {
  if (status === "Critical") return <AlertTriangle size={13} color="#f87171" />;
  if (status === "Resulted") return <CheckCircle size={13} color="#9fd8bd" />;
  return <Clock size={13} color="#e2a356" />;
}

const statusColors: Record<string, string> = {
  "Pending": "#93a096",
  "Collected": "#a3d1df",
  "Processing": "#e2a356",
  "Resulted": "#9fd8bd",
  "Critical": "#f87171",
};

// ---- New Order Modal ----
function NewOrderModal({ onClose }: { onClose: () => void }) {
  const { createOrder, loading: orderLoading } = useLaboratoryStore();
  const { patients, fetchPatients, loading: patientsLoading } = usePatientsStore();
  
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [testName, setTestName] = useState("Comprehensive Metabolic Panel");
  const [customTest, setCustomTest] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const debounceRef = useRef<any>(null);

  useEffect(() => {
    fetchPatients("", 1);
  }, [fetchPatients]);

  const handlePatientSearchChange = (val: string) => {
    setPatientSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPatients(val, 1), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!selectedPatientId) {
      setErr("Please select a patient.");
      return;
    }

    const finalTestName = testName === "Other" ? customTest.trim() : testName;
    if (!finalTestName) {
      setErr("Please specify the test name.");
      return;
    }

    const ok = await createOrder({
      patientId: selectedPatientId,
      testName: finalTestName,
    });

    if (ok) {
      setSuccess(true);
      setTimeout(onClose, 1000);
    } else {
      setErr(useLaboratoryStore.getState().error ?? "Failed to create lab order.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="glass card animate-fade-in" style={{ borderRadius: 14, width: 500, padding: 28 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#eeeae0" }}>Place New Lab Order</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle size={32} className="text-[#9fd8bd] mx-auto mb-2" />
            <h3 style={{ fontSize: 14, color: "#eeeae0", fontWeight: 600 }}>Order Placed Successfully</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Patient *</label>
              <div className="relative mb-2">
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#93a096" }} />
                <input
                  className="input pl-8 text-[12.5px] w-full"
                  placeholder="Type name or MRN to filter..."
                  value={patientSearch}
                  onChange={(e) => handlePatientSearchChange(e.target.value)}
                />
              </div>
              <select
                required
                className="input w-full text-[13px]"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                size={patients.length > 0 ? Math.min(patients.length, 4) : 1}
                style={{ height: "auto", maxHeight: 110 }}
              >
                <option value="" disabled>Select patient from search results...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.mrn})</option>
                ))}
              </select>
              {patientsLoading && <div style={{ fontSize: 11, color: "#93a096", marginTop: 4 }}>Searching patients...</div>}
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Test Name *</label>
              <select
                className="input w-full"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              >
                <option value="Comprehensive Metabolic Panel">Comprehensive Metabolic Panel</option>
                <option value="Cardiac Troponin I">Cardiac Troponin I</option>
                <option value="CBC with Differential">CBC with Differential</option>
                <option value="PT/INR, aPTT">PT/INR, aPTT</option>
                <option value="Urinalysis + Culture">Urinalysis + Culture</option>
                <option value="Lipid Panel">Lipid Panel</option>
                <option value="Other">Other (Type custom test)...</option>
              </select>
              {testName === "Other" && (
                <input
                  required
                  className="input w-full mt-2"
                  placeholder="Enter custom test name..."
                  value={customTest}
                  onChange={(e) => setCustomTest(e.target.value)}
                />
              )}
            </div>

            {err && <div className="text-red-400 text-xs">{err}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary flex items-center gap-2" style={{ fontSize: 13 }} disabled={orderLoading}>
                {orderLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Place Order
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---- Enter Result Modal ----
function ResultModal({ order, onClose }: { order: LabOrder; onClose: () => void }) {
  const { updateResult, loading: resultLoading } = useLaboratoryStore();
  const [result, setResult] = useState(order.result ?? "");
  const [status, setStatus] = useState<any>(order.status);
  const [criticalNotes, setCriticalNotes] = useState(order.criticalNotes ?? "");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  // File Upload State
  const [attachments, setAttachments] = useState<Array<{ name: string; size: string; type: string; progress: number }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const newFile = {
      name: files[0].name,
      size: `${(files[0].size / 1024).toFixed(1)} KB`,
      type: files[0].type || "application/octet-stream",
      progress: 0
    };

    setAttachments(prev => [...prev, newFile]);

    // Simulate progress bar increments
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 20;
      setAttachments(prev => prev.map(f => f.name === newFile.name ? { ...f, progress: currentProgress } : f));
      if (currentProgress >= 100) {
        clearInterval(interval);
        setUploading(false);
      }
    }, 150);
  };

  const handleRemoveFile = (fileName: string) => {
    setAttachments(prev => prev.filter(f => f.name !== fileName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!result.trim()) {
      setErr("Please enter the test result values.");
      return;
    }

    const ok = await updateResult(order.id, {
      result: result.trim(),
      status,
      criticalNotes: status === "Critical" ? criticalNotes.trim() : undefined,
    });

    if (ok) {
      setSuccess(true);
      setTimeout(onClose, 1000);
    } else {
      setErr(useLaboratoryStore.getState().error ?? "Failed to save results.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="glass card" style={{ borderRadius: 14, width: 480, padding: 28 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#eeeae0" }}>Enter Lab Results</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
        </div>

        <div className="p-3 mb-4 rounded-lg bg-white/5 border border-white/10" style={{ fontSize: 12 }}>
          <div style={{ color: "#93a096" }}>Patient: <strong style={{ color: "#eeeae0" }}>{order.patient?.firstName} {order.patient?.lastName}</strong></div>
          <div style={{ color: "#93a096", marginTop: 2 }}>Test: <strong style={{ color: "#eeeae0" }}>{order.testName}</strong></div>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle size={32} className="text-[#9fd8bd] mx-auto mb-2" />
            <h3 style={{ fontSize: 14, color: "#eeeae0", fontWeight: 600 }}>Results Saved</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Status</label>
              <select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Processing">Processing</option>
                <option value="Collected">Collected</option>
                <option value="Resulted">Resulted</option>
                <option value="Critical">Critical (High Risk)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Results Values *</label>
              <textarea
                required
                className="input w-full"
                rows={3}
                placeholder="e.g. LDL 168 mg/dL (High), WBC 8.4 x10^3/uL..."
                value={result}
                onChange={(e) => setResult(e.target.value)}
              />
            </div>

            {status === "Critical" && (
              <div>
                <label style={{ fontSize: 11, color: "#f87171", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Critical Notes *</label>
                <textarea
                  required
                  className="input w-full border-red-500/30"
                  rows={2}
                  placeholder="Detail high-risk clinical warnings, physician notifications..."
                  value={criticalNotes}
                  onChange={(e) => setCriticalNotes(e.target.value)}
                />
              </div>
            )}

            {/* Clinical scan / PDF attachments uploader */}
            <div className="space-y-2">
              <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>Clinical Scan & PDF Reports</label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border border-dashed border-white/10 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] transition-all text-center cursor-pointer space-y-1.5"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                <Paperclip size={16} className="mx-auto text-[var(--color-primary)]" />
                <div className="text-[11.5px] font-bold text-[#eeeae0]">Upload Scan Files & Lab PDFs</div>
                <div className="text-[10px] text-[#93a096]">Drag & drop or click to upload Chest X-rays, Ultrasounds, Pathology PDFs</div>
              </div>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="space-y-2 max-h-36 overflow-y-auto pt-1">
                  {attachments.map((file, fIdx) => (
                    <div key={fIdx} className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 max-w-[75%]">
                        <FileText size={14} className="text-sky-400 shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-[#eeeae0] truncate">{file.name}</div>
                          <div className="text-[9.5px] text-[#93a096]">{file.size} &bull; {file.type}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {file.progress < 100 ? (
                          <div className="flex items-center gap-1.5 font-mono text-[9px] text-sky-400">
                            <div className="w-12 bg-white/10 h-1 rounded-full overflow-hidden">
                              <div className="bg-sky-400 h-full transition-all duration-150" style={{ width: `${file.progress}%` }} />
                            </div>
                            <span>{file.progress}%</span>
                          </div>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8.5px] font-bold">READY</span>
                        )}
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.name); }}
                          className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {err && <div className="text-red-400 text-xs">{err}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary flex items-center gap-2" style={{ fontSize: 13 }} disabled={resultLoading}>
                {resultLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Submit Results
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---- Main Page Component ----
export default function LaboratoryPage() {
  const { orders, loading, error, fetchOrders } = useLaboratoryStore();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Aggregate metrics
  const counts = {
    Ordered: orders.filter((o) => o.status === "Pending").length,
    Collected: orders.filter((o) => o.status === "Collected").length,
    Processing: orders.filter((o) => o.status === "Processing").length,
    Resulted: orders.filter((o) => o.status === "Resulted").length,
    Critical: orders.filter((o) => o.status === "Critical").length,
  };

  const pipeline = [
    { label: "Ordered", count: counts.Ordered, color: "#93a096" },
    { label: "Collected", count: counts.Collected, color: "#a3d1df" },
    { label: "Processing", count: counts.Processing, color: "#e2a356" },
    { label: "Resulted", count: counts.Resulted, color: "#9fd8bd" },
    { label: "Critical", count: counts.Critical, color: "#f87171" },
  ];

  // Get active critical order alert
  const criticalOrder = orders.find((o) => o.status === "Critical");

  return (
    <>
      {showOrderModal && <NewOrderModal onClose={() => setShowOrderModal(false)} />}
      {selectedOrder && <ResultModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      <Topbar title="Laboratory" />
      <main className="p-6 space-y-5">
        {/* Pipeline */}
        <div className="grid grid-cols-5 gap-3">
          {pipeline.map(({ label, count, color }) => (
            <div key={label} className="card glass animate-fade-in" style={{ borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontFamily: "var(--font-display)", fontWeight: 300, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 11, color: "#93a096", marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Orders table */}
        <div className="glass-shell card glass relative" style={{ borderRadius: 12, padding: 0, minHeight: 300 }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-sm z-10 rounded-xl">
              <Loader2 className="animate-spin text-[#9fd8bd]" size={24} />
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(238,234,224,0.06)" }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#eeeae0" }}>Active Lab Orders</h2>
            <button
              className="btn-primary flex items-center gap-1.5"
              style={{ padding: "7px 14px", fontSize: 12 }}
              onClick={() => setShowOrderModal(true)}
            >
              <Plus size={12} /> New Order
            </button>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Lab ID</th>
                <th>Patient</th>
                <th>Test</th>
                <th>Ordered</th>
                <th>Status</th>
                <th>Result Preview</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#93a096]" style={{ fontSize: 13 }}>
                    No laboratory orders registered yet.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr
                  key={o.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedOrder(o)}
                >
                  <td style={{ fontFamily: "monospace", fontSize: 11, color: "#93a096" }}>{o.id.slice(0, 8)}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {o.patient ? `${o.patient.firstName} ${o.patient.lastName}` : "Unknown Patient"}
                    </div>
                    <div style={{ fontSize: 10, color: "#93a096" }}>{o.patient?.mrn ?? "—"}</div>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{o.testName}</td>
                  <td style={{ color: "#93a096", fontSize: 12 }}>
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={o.status} />
                      <span style={{ fontSize: 12, color: statusColors[o.status] }}>{o.status}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: o.status === "Critical" ? "#f87171" : "#eeeae0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.result ?? <span style={{ color: "#93a096", fontStyle: "italic" }}>Awaiting lab result</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Critical value alert banner */}
        {criticalOrder && (
          <div className="flex items-start gap-4 p-4 rounded-xl animate-pulse-slow" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)" }}>
            <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f87171", marginBottom: 4 }}>Critical Value Alert — Action Required</div>
              <div style={{ fontSize: 12.5, color: "#eeeae0", lineHeight: 1.4 }}>
                Patient <strong>{criticalOrder.patient ? `${criticalOrder.patient.firstName} ${criticalOrder.patient.lastName}` : "Unknown"} ({criticalOrder.patient?.mrn})</strong> has a critical value for <strong>{criticalOrder.testName}</strong>: <code style={{ color: "#f87171", background: "rgba(248,113,113,0.15)", padding: "2px 6px", borderRadius: 4 }}>{criticalOrder.result}</code>.
                {criticalOrder.criticalNotes && <div className="mt-2 text-white/80" style={{ fontSize: 12 }}>Notes: {criticalOrder.criticalNotes}</div>}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
