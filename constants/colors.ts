/**
 * Oda Design System Colors
 * Based on the poetry-inspired aesthetic from design mockups
 */

export const Colors = {
  // Primary colors
  ink: '#2C2C2C',        // Primary text, like ink on paper
  paper: '#F9F7F1',      // Main background, warm paper tone
  surface: '#FFFEFA',    // Card/elevated surface background
  pencil: '#8C867D',     // Secondary text, muted gray-brown
  wax: '#A84438',        // Accent color for CTAs and highlights

  // Semantic colors
  background: {
    light: '#F9F7F1',
    dark: '#1A1A1A',
  },
  text: {
    primary: '#2C2C2C',
    secondary: '#8C867D',
    inverse: '#FFFFFF',
  },
  border: {
    light: '#E5E0D6',
    medium: '#D0C9BC',
  },
} as const;

/**
 * Typography system matching the design
 */
export const Typography = {
  fontFamily: {
    display: 'CormorantGaramond_700Bold_Italic',  // Titles, headers
    body: 'EBGaramond_400Regular',                // Poem text, body copy
    bodyItalic: 'EBGaramond_400Regular_Italic',  // Italic poem text
    ui: 'Montserrat_500Medium',                  // UI elements, buttons, labels
    uiBold: 'Montserrat_600SemiBold',            // Bold UI text
  },
  fontSize: {
    xs: 10,
    sm: 11,
    base: 14,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.5,
    relaxed: 1.8,
  },
} as const;

/**
 * Spacing system (based on 4px grid)
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

/**
 * Shadow presets for elevation
 */
export const Shadows = {
  lift: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  liftHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

/**
 * Dark mode colour palette — warm ink-on-night-paper
 */
export const DarkColors = {
  ink:     '#E8E2D9',   // Cream text on dark background
  paper:   '#1C1A17',   // Very dark warm background
  surface: '#242018',   // Slightly lighter card surface
  pencil:  '#7A746C',   // Muted secondary text
  wax:     '#C4524A',   // Accent — slightly brighter for contrast

  background: {
    light: '#1C1A17',
    dark:  '#130F0B',
  },
  text: {
    primary:  '#E8E2D9',
    secondary: '#7A746C',
    inverse:  '#1C1A17',
  },
  border: {
    light:  '#333028',
    medium: '#403D36',
  },
} as const;
