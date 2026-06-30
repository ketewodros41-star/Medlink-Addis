"use client";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { Pill, AlertTriangle, CheckCircle, Package, Plus, Loader2, RefreshCw, X } from "lucide-react";
import { usePharmacyStore, Prescription, InventoryItem } from "@/store/pharmacyStore";

export default function PharmacyPage() {
  const {
    prescriptions,
    inventory,
    alerts,
    loading,
    error,
    fetchPharmacyData,
    dispensePrescription,
    restockInventory,
    addInventoryItem
  } = usePharmacyStore();

  // Modals state
  const [dispenseRx, setDispenseRx] = useState<Prescription | null>(null);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(100);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ drugName: "", stock: 100, reorderLevel: 20, expiryDate: "" });
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPharmacyData();
  }, [fetchPharmacyData]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'READY': return '#9fd8bd';
      case 'HOLD': return '#f87171';
      case 'DISPENSED': return '#9fd8bd';
      case 'PENDING': return '#e2a356';
      default: return '#93a096';
    }
  };

  const getStockColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CRITICAL': return '#f87171';
      case 'LOW': return '#e2a356';
      case 'OK': return '#9fd8bd';
      default: return '#93a096';
    }
  };

  const handleDispense = async () => {
    if (!dispenseRx) return;
    setActionLoading(true);
    setActionErr(null);
    const ok = await dispensePrescription(dispenseRx.id);
    setActionLoading(false);
    if (ok) {
      setDispenseRx(null);
    } else {
      setActionErr(usePharmacyStore.getState().error ?? "Failed to dispense medication");
    }
  };

  const handleRestock = async () => {
    if (!restockItem) return;
    setActionLoading(true);
    setActionErr(null);
    const ok = await restockInventory(restockItem.id, restockQty);
    setActionLoading(false);
    if (ok) {
      setRestockItem(null);
    } else {
      setActionErr(usePharmacyStore.getState().error ?? "Failed to restock item");
    }
  };

  const handleAddItem = async () => {
    if (!addForm.drugName || !addForm.expiryDate) {
      setActionErr("Please fill all required fields");
      return;
    }
    setActionLoading(true);
    setActionErr(null);
    const ok = await addInventoryItem({
      drugName: addForm.drugName,
      stock: Number(addForm.stock),
      reorderLevel: Number(addForm.reorderLevel),
      expiryDate: addForm.expiryDate,
    });
    setActionLoading(false);
    if (ok) {
      setShowAddModal(false);
      setAddForm({ drugName: "", stock: 100, reorderLevel: 20, expiryDate: "" });
    } else {
      setActionErr(usePharmacyStore.getState().error ?? "Failed to register drug");
    }
  };

  const pendingCount = prescriptions.filter(p => p.status === 'Pending').length;
  const dispensedCount = prescriptions.filter(p => p.status === 'Dispensed').length;
  const criticalStockCount = inventory.filter(i => i.status === 'Critical' || i.status === 'Low').length;

  return (
    <>
      <Topbar title="Pharmacy" />
      <main className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending Prescriptions", value: pendingCount, color: "#e2a356", icon: Pill },
            { label: "Medications Dispensed", value: dispensedCount, color: "#9fd8bd", icon: CheckCircle },
            { label: "Low/Critical Stock Alerts", value: criticalStockCount, color: "#f87171", icon: AlertTriangle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="card glass" style={{ borderRadius: 10 }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <div style={{ fontSize: "1.8rem", fontFamily: "var(--font-display)", fontWeight: 300, color: "#eeeae0", lineHeight: 1 }}>
                    {loading ? <Loader2 className="animate-spin text-sm" size={16} /> : value}
                  </div>
                  <div style={{ fontSize: 11, color: "#93a096", marginTop: 2 }}>{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Drug interaction alert */}
        {alerts.length > 0 && alerts.map(alert => (
          <div key={alert.id} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.20)" }}>
            <AlertTriangle size={17} color="#f87171" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f87171", marginBottom: 3 }}>Drug Interaction Warning — {alert.rxNumber}</div>
              <div style={{ fontSize: 12.5, color: "#eeeae0" }}>
                <strong>{alert.drugName}</strong> ({alert.patient?.firstName} {alert.patient?.lastName}) — {alert.interactionDetails || 'Prescription placed on hold pending review.'}
              </div>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-3 gap-5 relative min-h-[400px]">
          {loading && !dispenseRx && !restockItem && !showAddModal && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-xl">
              <Loader2 className="animate-spin text-[#9fd8bd]" size={24} />
            </div>
          )}

          {/* Prescriptions */}
          <div className="col-span-2 glass-shell card glass" style={{ borderRadius: 12, padding: 0 }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(238,234,224,0.06)" }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "#eeeae0" }}>Active Prescriptions</h2>
            </div>
            
            {error && <div className="text-red-400 text-sm p-4">Failed to load pharmacy data: {error}</div>}

            <table className="data-table">
              <thead><tr><th>Rx ID</th><th>Patient</th><th>Drug</th><th>Sig</th><th>Qty</th><th>Prescriber</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {prescriptions.length === 0 && !loading && !error && (
                  <tr><td colSpan={8} className="text-center py-8 text-[#93a096]">No active prescriptions found.</td></tr>
                )}
                {prescriptions.map(rx => {
                  const color = getStatusColor(rx.status);
                  return (
                    <tr key={rx.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "#93a096" }}>{rx.rxNumber}</td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{rx.patient?.firstName} {rx.patient?.lastName}</td>
                      <td>
                        <div style={{ fontSize: 12.5 }}>{rx.drugName}</div>
                        {rx.interactionAlert && <div style={{ fontSize: 10, color: "#f87171", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}><AlertTriangle size={9} /> Interaction</div>}
                      </td>
                      <td style={{ color: "#93a096", fontSize: 12 }}>{rx.sig}</td>
                      <td style={{ color: "#93a096" }}>{rx.qty}</td>
                      <td style={{ color: "#93a096", fontSize: 12 }}>{rx.prescriberName}</td>
                      <td><span className="badge" style={{ color: color, borderColor: `${color}40`, background: `${color}10` }}>{rx.status}</span></td>
                      <td>
                        {rx.status === 'Pending' && (
                          <button
                            onClick={() => { setActionErr(null); setDispenseRx(rx); }}
                            className="btn-primary"
                            style={{ fontSize: 11, padding: "5px 10px" }}
                          >
                            Dispense
                          </button>
                        )}
                        {rx.status === 'Dispensed' && (
                          <span className="text-xs text-[#93a096] italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Stock levels */}
          <div className="glass-shell card glass" style={{ borderRadius: 12, display: "flex", flexDirection: "column" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={14} color="#9fd8bd" />
                <h2 style={{ fontSize: 13, fontWeight: 600, color: "#eeeae0" }}>Stock Monitor</h2>
              </div>
              <button
                onClick={() => { setActionErr(null); setShowAddModal(true); }}
                className="btn-ghost flex items-center gap-1"
                style={{ fontSize: 11, padding: "4px 8px" }}
              >
                <Plus size={11} /> New Drug
              </button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {inventory.length === 0 && !loading && !error && (
                <div className="text-center py-8 text-[#93a096]">No inventory items found.</div>
              )}
              {inventory.map(s => {
                const pct = Math.min((s.stock / (s.reorderLevel * 5)) * 100, 100);
                const color = getStockColor(s.status);
                return (
                  <div key={s.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "#eeeae0" }}>{s.drugName}</span>
                      <div className="flex items-center gap-2">
                        <span className="badge" style={{ color, borderColor: `${color}40`, background: `${color}10`, fontSize: 10 }}>{s.status}</span>
                        <button
                          onClick={() => { setActionErr(null); setRestockItem(s); }}
                          title="Restock Item"
                          className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 text-xs"
                        >
                          <RefreshCw size={10} style={{ color: "#9fd8bd" }} />
                        </button>
                      </div>
                    </div>
                    <div style={{ height: 4, background: "rgba(238,234,224,0.08)", borderRadius: 999 }}>
                      <div style={{ height: 4, width: `${pct}%`, background: color, borderRadius: 999 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 10.5, color: "#93a096" }}>Stock: {s.stock}</span>
                      <span style={{ fontSize: 10.5, color: "#93a096" }}>Exp: {new Date(s.expiryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Dispense Modal ─── */}
        {dispenseRx && (
          <div className="modal-backdrop">
            <div className="modal-content glass shadow-xl" style={{ maxWidth: 420 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#eeeae0]" style={{ fontSize: 15 }}>Dispense Medication</h3>
                <button onClick={() => setDispenseRx(null)} className="text-[#93a096] hover:text-[#eeeae0]">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3 mb-5" style={{ fontSize: 13, color: "#eeeae0" }}>
                <div>Patient: <strong>{dispenseRx.patient?.firstName} {dispenseRx.patient?.lastName}</strong></div>
                <div>Medication: <strong>{dispenseRx.drugName}</strong></div>
                <div>Directions: <span className="text-[#93a096]">{dispenseRx.sig}</span></div>
                <div>Quantity to Dispense: <strong>{dispenseRx.qty} units</strong></div>
              </div>
              {actionErr && <div className="text-red-400 text-xs mb-4">{actionErr}</div>}
              <div className="flex justify-end gap-3">
                <button onClick={() => setDispenseRx(null)} className="btn-secondary" style={{ fontSize: 12.5 }}>Cancel</button>
                <button onClick={handleDispense} disabled={actionLoading} className="btn-primary" style={{ fontSize: 12.5 }}>
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : "Confirm Dispense"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Restock Modal ─── */}
        {restockItem && (
          <div className="modal-backdrop">
            <div className="modal-content glass shadow-xl" style={{ maxWidth: 380 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#eeeae0]" style={{ fontSize: 15 }}>Restock Inventory</h3>
                <button onClick={() => setRestockItem(null)} className="text-[#93a096] hover:text-[#eeeae0]">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4 mb-5">
                <div>
                  <div style={{ fontSize: 12, color: "#93a096", marginBottom: 4 }}>Medication</div>
                  <div style={{ fontSize: 14, color: "#eeeae0", fontWeight: 600 }}>{restockItem.drugName}</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Quantity to Add *</label>
                  <input
                    type="number"
                    className="input"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                  />
                </div>
              </div>
              {actionErr && <div className="text-red-400 text-xs mb-4">{actionErr}</div>}
              <div className="flex justify-end gap-3">
                <button onClick={() => setRestockItem(null)} className="btn-secondary" style={{ fontSize: 12.5 }}>Cancel</button>
                <button onClick={handleRestock} disabled={actionLoading} className="btn-primary" style={{ fontSize: 12.5 }}>
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : "Confirm Restock"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Add Item Modal ─── */}
        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal-content glass shadow-xl" style={{ maxWidth: 420 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#eeeae0]" style={{ fontSize: 15 }}>Register New Drug</h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#93a096] hover:text-[#eeeae0]">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4 mb-5">
                <div>
                  <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Drug Name *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Paracetamol 500mg"
                    value={addForm.drugName}
                    onChange={(e) => setAddForm(f => ({ ...f, drugName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Initial Stock *</label>
                    <input
                      type="number"
                      className="input"
                      value={addForm.stock}
                      onChange={(e) => setAddForm(f => ({ ...f, stock: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Reorder Level *</label>
                    <input
                      type="number"
                      className="input"
                      value={addForm.reorderLevel}
                      onChange={(e) => setAddForm(f => ({ ...f, reorderLevel: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#93a096", display: "block", marginBottom: 6 }}>Expiry Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={addForm.expiryDate}
                    onChange={(e) => setAddForm(f => ({ ...f, expiryDate: e.target.value }))}
                  />
                </div>
              </div>
              {actionErr && <div className="text-red-400 text-xs mb-4">{actionErr}</div>}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ fontSize: 12.5 }}>Cancel</button>
                <button onClick={handleAddItem} disabled={actionLoading} className="btn-primary" style={{ fontSize: 12.5 }}>
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : "Register Medication"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
