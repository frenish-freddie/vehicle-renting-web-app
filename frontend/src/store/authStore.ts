import { create } from "zustand";
import api from "@/services/api";
import { User } from "@/types";

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  dashboardStats: any | null;
  login: (token: string) => void;
  logout: () => void;
  loadSession: () => void;
  fetchDashboardStats: () => Promise<void>;
}

// Decode JWT token safely in the browser
const decodeToken = (token: string): User | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.sub,
      role: decoded.role,
      created_at: new Date().toISOString(),
    };
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: false,
  error: null,
  dashboardStats: null,

  login: (token: string) => {
    localStorage.setItem("flexiride_token", token);
    const decodedUser = decodeToken(token);
    set({ token, user: decodedUser, error: null });
    get().fetchDashboardStats();
  },

  logout: () => {
    localStorage.removeItem("flexiride_token");
    set({ token: null, user: null, dashboardStats: null, error: null });
  },

  loadSession: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("flexiride_token");
      if (token) {
        const decodedUser = decodeToken(token);
        if (decodedUser) {
          set({ token, user: decodedUser });
          get().fetchDashboardStats();
        } else {
          localStorage.removeItem("flexiride_token");
        }
      }
    }
  },

  fetchDashboardStats: async () => {
    const { user, token } = get();
    if (!user || !token) return;
    
    set({ isLoading: true });
    try {
      const response = await api.get(`/api/dashboards/${user.role}`);
      set({ dashboardStats: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Failed to load dashboard metrics", isLoading: false });
    }
  },
}));
