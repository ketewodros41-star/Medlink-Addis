import { create } from 'zustand';
import api from '@/lib/api';

export interface Prescription {
  id: string;
  rxNumber: string;
  drugName: string;
  sig: string;
  qty: number;
  prescriberName: string;
  status: string;
  interactionAlert: boolean;
  interactionDetails: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface InventoryItem {
  id: string;
  drugName: string;
  stock: number;
  reorderLevel: number;
  expiryDate: string;
  status: string;
}

interface PharmacyState {
  prescriptions: Prescription[];
  inventory: InventoryItem[];
  alerts: Prescription[];
  loading: boolean;
  error: string | null;
  fetchPharmacyData: () => Promise<void>;
  dispensePrescription: (id: string) => Promise<boolean>;
  restockInventory: (id: string, qty: number) => Promise<boolean>;
  addInventoryItem: (item: { drugName: string; stock: number; reorderLevel: number; expiryDate: string }) => Promise<boolean>;
}

export const usePharmacyStore = create<PharmacyState>((set, get) => ({
  prescriptions: [],
  inventory: [],
  alerts: [],
  loading: false,
  error: null,

  fetchPharmacyData: async () => {
    set({ loading: true, error: null });
    try {
      const [prescriptionsRes, inventoryRes, alertsRes] = await Promise.all([
        api.get('/pharmacy/prescriptions'),
        api.get('/pharmacy/inventory'),
        api.get('/pharmacy/alerts'),
      ]);
      set({
        prescriptions: prescriptionsRes.data.data,
        inventory: inventoryRes.data.data,
        alerts: alertsRes.data.data,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  dispensePrescription: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/pharmacy/prescriptions/${id}/dispense`);
      set({ loading: false });
      await get().fetchPharmacyData();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },

  restockInventory: async (id, qty) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/pharmacy/inventory/${id}/restock`, { qty });
      set({ loading: false });
      await get().fetchPharmacyData();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },

  addInventoryItem: async (item) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/pharmacy/inventory/add-item`, item);
      set({ loading: false });
      await get().fetchPharmacyData();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
}));
