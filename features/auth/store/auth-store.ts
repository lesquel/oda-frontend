import { create } from 'zustand';
import { User, authApi, RegisterRequest, LoginRequest } from '../services/auth-api';
import { usersApi, UpdateProfileRequest } from '@/features/users/services/users-api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  register: (data: RegisterRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  clearError: () => void;
}

/**
 * Zustand store for authentication state
 * Manages user session, login/register, and auth persistence
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  register: async (data: RegisterRequest) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.register(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  login: async (data: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.login(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    await authApi.logout();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadUser: async () => {
    try {
      const hasToken = await authApi.hasToken();
      if (!hasToken) {
        set({ isLoading: false });
        return;
      }

      set({ isLoading: true });
      const user = await authApi.getProfile();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Token invalid or expired
      await authApi.logout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  updateProfile: async (data: UpdateProfileRequest) => {
    try {
      set({ isLoading: true, error: null });
      const updatedUser = await usersApi.updateProfile(data);
      set((state) => ({
        user: { ...state.user!, ...updatedUser },
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Update failed',
        isLoading: false,
      });
      throw error;
    }
  },
}));
