import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppTheme = 'light' | 'dark';
export type DisplayFont = 'cormorant' | 'ebgaramond' | 'montserrat';
export type FontScale = 'small' | 'normal' | 'large';

interface ThemeState {
  theme: AppTheme;
  displayFont: DisplayFont;
  fontScale: FontScale;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
  setDisplayFont: (font: DisplayFont) => void;
  setFontScale: (scale: FontScale) => void;
}

/** Maps DisplayFont key → loaded font-family name for display variant */
export const displayFontMap: Record<DisplayFont, string> = {
  cormorant: 'CormorantGaramond_700Bold_Italic',
  ebgaramond: 'EBGaramond_400Regular',
  montserrat: 'Montserrat_600SemiBold',
};

export const displayFontLabels: Record<DisplayFont, string> = {
  cormorant: 'Cormorant Garamond',
  ebgaramond: 'EB Garamond',
  montserrat: 'Montserrat',
};

export const fontScaleMultiplier: Record<FontScale, number> = {
  small: 0.85,
  normal: 1,
  large: 1.2,
};

export const fontScaleLabels: Record<FontScale, string> = {
  small: 'Pequeño',
  normal: 'Normal',
  large: 'Grande',
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  displayFont: 'cormorant',
  fontScale: 'normal',
  toggleTheme: () => {
    const next: AppTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: next });
    AsyncStorage.setItem('@oda_theme', next).catch(() => {});
  },
  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem('@oda_theme', theme).catch(() => {});
  },
  setDisplayFont: (displayFont) => {
    set({ displayFont });
    AsyncStorage.setItem('@oda_display_font', displayFont).catch(() => {});
  },
  setFontScale: (fontScale) => {
    set({ fontScale });
    AsyncStorage.setItem('@oda_font_scale', fontScale).catch(() => {});
  },
}));

// Hydrate from storage on startup
Promise.all([
  AsyncStorage.getItem('@oda_theme'),
  AsyncStorage.getItem('@oda_display_font'),
  AsyncStorage.getItem('@oda_font_scale'),
]).then(([savedTheme, savedFont, savedScale]) => {
  const s = useThemeStore.getState();
  if (savedTheme === 'light' || savedTheme === 'dark') s.setTheme(savedTheme);
  if (savedFont === 'cormorant' || savedFont === 'ebgaramond' || savedFont === 'montserrat') s.setDisplayFont(savedFont as DisplayFont);
  if (savedScale === 'small' || savedScale === 'normal' || savedScale === 'large') s.setFontScale(savedScale as FontScale);
}).catch(() => {});
