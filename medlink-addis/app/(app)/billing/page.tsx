"use client";
import { useEffect, useState, useRef } from "react";
import Topbar from "@/components/Topbar";
import { Receipt, TrendingUp, Clock, CheckCircle, Plus, Download, Loader2, X, Trash } from "lucide-react";
import { useBillingStore, Invoice } from "@/store/billingStore";
import { usePatientsStore } from "@/store/patientsStore";

export default function BillingPage() {
  const { invoices, metrics, loading, error, fetchBillingData, createInvoice, recordPayment } = useBillingStore();
  const { patients, fetchPatients, loading: patientsLoading } = usePatientsStore();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);

  // New Invoice Form
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<Array<{ description: string; quantity: number; unitPrice: number; serviceType: string }>>([
    { description: "General Consultation", quantity: 1, unitPrice: 300, serviceType: "Consultation" }
  ]);
  const [showPatientsDropdown, setShowPatientsDropdown] = useState(false);
  const debounceRef = useRef<any>(null);

  // Record Payment Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payRef, setPayRef] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // Debounced Patient Search
  const handlePatientSearchChange = (val: string) => {
    setPatientSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPatients(val, 1);
      setShowPatientsDropdown(true);
    }, 300);
  };

  const handleCreateInvoice = async () => {
    if (!selectedPatientId) {
      setActionErr("Please select a registered patient");
      return;
    }
    if (invoiceItems.some(i => !i.description || i.quantity <= 0 || i.unitPrice <= 0)) {
      setActionErr("Please enter valid item details");
      return;
    }

    setActionLoading(true);
    setActionErr(null);
    const ok = await createInvoice({
      patientId: selectedPatientId,
      dueDate: dueDate || undefined,
      items: invoiceItems
    });
    setActionLoading(false);
    if (ok) {
      setShowCreateModal(false);
      // Reset form
      setPatientSearch("");
      setSelectedPatientId("");
      setDueDate("");
      setInvoiceItems([{ description: "General Consultation", quantity: 1, unitPrice: 300, serviceType: "Consultation" }]);
    } else {
      setActionErr(useBillingStore.getState().error ?? "Failed to create invoice");
    }
  };

  const handleRecordPayment = async () => {
    if (!payInvoice) return;
    if (payAmount <= 0) {
      setActionErr("Please enter a valid payment amount");
      return;
    }
    setActionLoading(true);
    setActionErr(null);
    const ok = await recordPayment(payInvoice.id, {
      amount: payAmount,
      method: payMethod,
      referenceNumber: payRef || undefined
    });
    setActionLoading(false);
    if (ok) {
      setPayInvoice(null);
      setPayAmount(0);
      setPayRef("");
    } else {
      setActionErr(useBillingStore.getState().error ?? "Failed to record payment");
    }
  };

  // Map backend status to UI color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID': return '#9fd8bd';
      case 'UNPAID': return '#f87171';
      case 'PARTIAL': return '#e2a356';
      case 'INSURANCE': return '#a3d1df';
      default: return '#93a096';
    }
  };

  return (
    <>
      <Topbar title="Billing" />
      <main className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: `ETB ${metrics.totalRevenue.toLocaleString()}`, delta: "Accumulated",  color: "#9fd8bd", icon: TrendingUp },
            { label: "Outstanding",   value: `ETB ${metrics.outstanding.toLocaleString()}`,  delta: "Unpaid balance", color: "#e2a356", icon: Clock },
            { label: "Insurance Claims", value: "ETB 0",  delta: "0 pending", color: "#a3d1df", icon: Receipt },
            { label: "Invoices Generated", value: metrics.invoicesCount.toString(), delta: "Total", color: "#9fd8bd", icon: CheckCircle },
          ].map(({ label, value, delta, color, icon: Icon }) => (
            <div key={label} className="glass-shell card glass" style={{ borderRadius: 10 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span style={{ fontSize: 10, color }}>{delta}</span>
              </div>
              <div style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 300, color: "#eeeae0", lineHeight: 1 }}>
                {loading && !payInvoice && !showCreateModal ? <Loader2 className="animate-spin text-sm" size={16}/> : value}
              </div>
              <div style={{ fontSize: 11, color: "#93a096", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Invoice table */}
        <div className="glass-shell card glass relative" style={{ borderRadius: 12, padding: 0, minHeight: 400 }}>
          {loading && !payInvoice && !showCreateModal && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-xl">
              <Loader2 className="animate-spin text-[#9fd8bd]" size={24} />
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(238,234,224,0.06)" }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#eeeae0" }}>Recent Invoices</h2>
            <div className="flex items-center gap-2">
              <button className="btn-primary flex items-center gap-1.5" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => { setActionErr(null); setShowCreateModal(true); }}>
                <Plus size={12} /> New Invoice
              </button>
            </div>
          </div>
          
          {error && <div className="text-red-400 text-sm p-4">Failed to load invoices: {error}</div>}
          
          <table className="data-table">
            <thead><tr><th>Invoice</th><th>Patient</th><th>Due Date</th><th>Amount</th><th>Paid</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {invoices.length === 0 && !loading && !error && (
                 <tr><td colSpan={7} className="text-center py-8 text-[#93a096]">No invoices found.</td></tr>
              )}
              {invoices.map(inv => {
                const color = getStatusColor(inv.status);
                const outstanding = Number(inv.grandTotal) - Number(inv.amountPaid);
                return (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 11, color: "#93a096" }}>{inv.invoiceNumber}</td>
                    <td style={{ fontWeight: 600 }}>{inv.patient?.firstName} {inv.patient?.lastName}</td>
                    <td style={{ color: "#93a096", fontSize: 12 }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "Immediate"}</td>
                    <td style={{ fontWeight: 600 }}>ETB {Number(inv.grandTotal).toLocaleString()}</td>
                    <td style={{ color: "#93a096" }}>ETB {Number(inv.amountPaid).toLocaleString()}</td>
                    <td><span className="badge" style={{ color: color, borderColor: `${color}40`, background: `${color}10` }}>{inv.status}</span></td>
                    <td>
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => { setActionErr(null); setPayAmount(outstanding); setPayInvoice(inv); }}
                          className="btn-primary"
                          style={{ fontSize: 11, padding: "5px 10px" }}
                        >
                          Collect Payment
                        </button>
                      )}
                      {inv.status === 'Paid' && (
                        <span className="text-xs text-[#93a096] italic">Paid</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─── Create Invoice Modal ─── */}
        {showCreateModal && (
          <div className="modal-backdrop">
            <div className="modal-content glass shadow-xl" style={{ maxWidth: 560, width: "100%" }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#eeeae0]" style={{ fontSize: 15 }}>Create Service Invoice</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-[#93a096] hover:text-[#eeeae0]">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 mb-5">
                {/* Patient Search */}
                <div className="relative">
                  <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Search Patient *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Type MRN or Patient Name..."
                    value={patientSearch}
                    onChange={(e) => handlePatientSearchChange(e.target.value)}
                  />
                  {showPatientsDropdown && patientSearch && (
                    <div className="absolute left-0 right-0 mt-1 rounded-lg border border-white/10 bg-[#1e2521] shadow-2xl z-20 max-h-40 overflow-y-auto">
                      {patientsLoading && <div className="p-3 text-xs text-[#93a096]">Searching patients...</div>}
                      {patients.length === 0 && !patientsLoading && <div className="p-3 text-xs text-[#93a096]">No matching patients</div>}
                      {patients.map(p => (
                        <div
                          key={p.id}
                          className="p-2.5 hover:bg-white/5 cursor-pointer text-xs flex justify-between"
                          onClick={() => {
                            setSelectedPatientId(p.id);
                            setPatientSearch(`${p.firstName} ${p.lastName} (${p.mrn})`);
                            setShowPatientsDropdown(false);
                          }}
                        >
                          <span style={{ color: "#eeeae0" }}>{p.firstName} {p.lastName}</span>
                          <span style={{ color: "#93a096" }}>{p.mrn}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Due Date</label>
                    <input
                      type="date"
                      className="input"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label style={{ fontSize: 11, color: "#93a096", fontWeight: 600 }}>Invoice Line Items</label>
                    <button
                      type="button"
                      onClick={() => setInvoiceItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0, serviceType: "Service" }])}
                      className="btn-ghost text-xs"
                      style={{ padding: "4px 8px" }}
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {invoiceItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder="Description (e.g. Lab test fee)"
                          value={item.description}
                          onChange={(e) => setInvoiceItems(prev => prev.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))}
                          style={{ fontSize: 12, padding: "6px 10px" }}
                        />
                        <input
                          type="number"
                          className="input w-16"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => setInvoiceItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) } : it))}
                          style={{ fontSize: 12, padding: "6px 10px" }}
                        />
                        <input
                          type="number"
                          className="input w-24"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => setInvoiceItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: Number(e.target.value) } : it))}
                          style={{ fontSize: 12, padding: "6px 10px" }}
                        />
                        {invoiceItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setInvoiceItems(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {actionErr && <div className="text-red-400 text-xs mb-4">{actionErr}</div>}

              <div className="flex justify-end gap-3 pt-3" style={{ borderTop: "1px solid rgba(238,234,224,0.06)" }}>
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ fontSize: 12.5 }}>Cancel</button>
                <button onClick={handleCreateInvoice} disabled={actionLoading} className="btn-primary" style={{ fontSize: 12.5 }}>
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : "Generate Invoice"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Record Payment Modal ─── */}
        {payInvoice && (
          <div className="modal-backdrop">
            <div className="modal-content glass shadow-xl" style={{ maxWidth: 400 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#eeeae0]" style={{ fontSize: 15 }}>Record Invoice Payment</h3>
                <button onClick={() => setPayInvoice(null)} className="text-[#93a096] hover:text-[#eeeae0]">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 mb-5">
                <div style={{ fontSize: 13, color: "#eeeae0" }} className="space-y-2">
                  <div>Invoice Number: <strong>{payInvoice.invoiceNumber}</strong></div>
                  <div>Patient: <strong>{payInvoice.patient?.firstName} {payInvoice.patient?.lastName}</strong></div>
                  <div>Grand Total: <strong>ETB {Number(payInvoice.grandTotal).toLocaleString()}</strong></div>
                  <div>Already Paid: <span className="text-[#9fd8bd]">ETB {Number(payInvoice.amountPaid).toLocaleString()}</span></div>
                  <div>Remaining Balance: <span className="text-[#fb923c]">ETB {(Number(payInvoice.grandTotal) - Number(payInvoice.amountPaid)).toLocaleString()}</span></div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Payment Amount (ETB) *</label>
                  <input
                    type="number"
                    className="input"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Payment Method *</label>
                    <select
                      className="input"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      style={{ padding: "6px 10px", fontSize: 13 }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Reference Number</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. TX-10029"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {actionErr && <div className="text-red-400 text-xs mb-4">{actionErr}</div>}

              <div className="flex justify-end gap-3 pt-3" style={{ borderTop: "1px solid rgba(238,234,224,0.06)" }}>
                <button onClick={() => setPayInvoice(null)} className="btn-secondary" style={{ fontSize: 12.5 }}>Cancel</button>
                <button onClick={handleRecordPayment} disabled={actionLoading} className="btn-primary" style={{ fontSize: 12.5 }}>
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
