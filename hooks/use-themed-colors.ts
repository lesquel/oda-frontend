import { useThemeStore } from '@/store/theme-store';
import { Colors, DarkColors } from '@/constants/colors';

/**
 * Returns the correct color palette based on the active theme.
 * Use this instead of importing Colors directly so components react
 * to dark/light mode changes.
 */
export function useThemedColors() {
  const { theme } = useThemeStore();
  return theme === 'dark' ? DarkColors : Colors;
}
