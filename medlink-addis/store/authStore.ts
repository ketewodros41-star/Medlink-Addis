import { create } from 'zustand';
import api from '@/lib/api';

export interface Hospital {
  id: string;
  name: string;
}

export interface UserDecrypted {
  sub: string;
  hospital_id: string;
  roles: string[];
  permissions: string[];
  session_id: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: { name: string }[];
}

interface AuthState {
  accessToken: string | null;
  user: UserDecrypted | null;
  profile: UserProfile | null;
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
  fetchHospitals: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  login: (email: string, password: string, hospitalId: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
}

// Decrypt JWT payload for frontend logic
const parseJwt = (token: string): UserDecrypted | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  profile: null,
  hospitals: [],
  loading: false,
  error: null,
  fetchHospitals: async () => {
    try {
      const response = await api.get('/auth/hospitals');
      set({ hospitals: response.data.data });
    } catch (err: any) {
      console.error('Failed to fetch hospitals list', err);
    }
  },
  fetchProfile: async () => {
    try {
      const response = await api.get('/users/me');
      set({ profile: response.data.data });
    } catch (err: any) {
      console.error('Failed to fetch user profile', err);
    }
  },
  login: async (email, password, hospitalId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        hospitalId,
        deviceFingerprint: 'nextjs-web-client',
      });
      const { accessToken, sessionId } = response.data.data;
      const user = parseJwt(accessToken);

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('sessionId', sessionId);
      }

      set({ accessToken, user, loading: false });
      // Fetch user profile immediately after login
      useAuthStore.getState().fetchProfile();
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ error: errMsg, loading: false });
      return false;
    }
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        api.post('/auth/logout', { sessionId }).catch(console.error);
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('sessionId');
    }
    set({ accessToken: null, user: null, profile: null });
  },
  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const user = parseJwt(token);
        // Check if token is expired
        const payload = JSON.parse(window.atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          set({ accessToken: token, user });
          // Fetch profile for persistent sessions
          useAuthStore.getState().fetchProfile();
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('sessionId');
        }
      }
    }
  },
}));
