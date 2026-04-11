import { create } from 'zustand';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  getRider,
  setRider as persistRider,
} from '../services/storage';

export interface Rider {
  _id: string;
  phone: string;
  name: string;
  email?: string;
  vehicleType: 'bike' | 'scooter' | 'car';
  vehicleNumber: string;
  status: 'offline' | 'online' | 'on-delivery';
  isVerified: boolean;
  isDocumentsApproved: boolean;
  rating: number;
  totalDeliveries: number;
  avatar?: string;
}

interface AuthState {
  rider: Rider | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true during initial hydration

  // Actions
  login: (accessToken: string, refreshToken: string, rider: Rider) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  updateRider: (partial: Partial<Rider>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  rider: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (accessToken, refreshToken, rider) => {
    await setTokens(accessToken, refreshToken);
    await persistRider(rider);
    set({
      rider,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    await clearTokens();
    set({
      rider: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  hydrate: async () => {
    try {
      const accessToken = await getAccessToken();
      const rider = await getRider();

      if (accessToken && rider) {
        set({
          rider,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Hydration error:', error);
      set({ isLoading: false });
    }
  },

  updateRider: async (partial) => {
    const currentRider = get().rider;
    if (currentRider) {
      const updated = { ...currentRider, ...partial };
      await persistRider(updated);
      set({ rider: updated });
    }
  },
}));
