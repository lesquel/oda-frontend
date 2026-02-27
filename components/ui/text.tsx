import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { Typography } from '@/constants/colors';
import { useThemedColors } from '@/hooks/use-themed-colors';
import { useThemeStore, displayFontMap, fontScaleMultiplier } from '@/store/theme-store';

interface TextProps extends RNTextProps {
  variant?: 'display' | 'body' | 'bodyItalic' | 'ui' | 'uiBold';
  color?: 'primary' | 'secondary' | 'accent' | 'inverse';
}

/**
 * Text component with Oda typography presets — theme-aware.
 * Respects the user's display-font and font-scale preferences from the store.
 */
export function Text({ 
  variant = 'body', 
  color = 'primary',
  style, 
  ...props 
}: TextProps) {
  const C = useThemedColors();
  const { displayFont, fontScale } = useThemeStore();

  // For the 'display' variant, use the user-chosen font; others keep defaults.
  const fontFamily =
    variant === 'display'
      ? displayFontMap[displayFont]
      : Typography.fontFamily[variant];

  const scale = fontScaleMultiplier[fontScale];

  const textColor = {
    primary: C.text.primary,
    secondary: C.text.secondary,
    accent: C.wax,
    inverse: C.text.inverse,
  }[color];

  // Extract fontSize from style (if any) and apply scale
  const flat = StyleSheet.flatten(style) ?? {};
  const baseFontSize = (flat as any).fontSize as number | undefined;
  const scaledSize = baseFontSize ? baseFontSize * scale : undefined;

  return (
    <RNText
      style={[
        { fontFamily, color: textColor },
        style,
        scaledSize !== undefined ? { fontSize: scaledSize } : undefined,
      ]}
      {...props}
    />
  );
}
