import { create } from "zustand";
import api from "@/lib/api";

export interface Role {
  name: string;
}

export interface User {
  id: string;
  hospitalId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  isActive: boolean;
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (data: any) => Promise<boolean>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/users");
      set({ users: response.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },
  createUser: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.post("/users", data);
      set({ loading: false });
      await get().fetchUsers();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return false;
    }
  },
}));
