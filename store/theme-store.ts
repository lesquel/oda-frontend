import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppTheme = 'light' | 'dark';

interface ThemeState {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  toggleTheme: () => {
    const next: AppTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: next });
    AsyncStorage.setItem('@oda_theme', next).catch(() => {});
  },
  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem('@oda_theme', theme).catch(() => {});
  },
}));

// Hydrate from storage on startup
AsyncStorage.getItem('@oda_theme').then((saved) => {
  if (saved === 'light' || saved === 'dark') {
    useThemeStore.getState().setTheme(saved as AppTheme);
  }
}).catch(() => {});
