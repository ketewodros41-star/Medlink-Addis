import { create } from 'zustand';
import api from '@/lib/api';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  amountPaid: number;
  dueDate: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  items: InvoiceItem[];
}

interface BillingState {
  invoices: Invoice[];
  metrics: {
    totalRevenue: number;
    outstanding: number;
    invoicesCount: number;
  };
  loading: boolean;
  error: string | null;
  fetchBillingData: () => Promise<void>;
  createInvoice: (dto: {
    patientId: string;
    dueDate?: string;
    items: Array<{ description: string; quantity: number; unitPrice: number; serviceType?: string }>;
  }) => Promise<boolean>;
  recordPayment: (invoiceId: string, dto: { amount: number; method: string; referenceNumber?: string }) => Promise<boolean>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  invoices: [],
  metrics: {
    totalRevenue: 0,
    outstanding: 0,
    invoicesCount: 0,
  },
  loading: false,
  error: null,

  fetchBillingData: async () => {
    set({ loading: true, error: null });
    try {
      const [invoicesRes, metricsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/invoices/metrics'),
      ]);
      set({ 
        invoices: invoicesRes.data.data, 
        metrics: invoicesRes.data.data,
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createInvoice: async (dto) => {
    set({ loading: true, error: null });
    try {
      await api.post('/invoices', dto);
      set({ loading: false });
      await get().fetchBillingData();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },

  recordPayment: async (invoiceId, dto) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/invoices/${invoiceId}/payments`, dto);
      set({ loading: false });
      await get().fetchBillingData();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
}));
