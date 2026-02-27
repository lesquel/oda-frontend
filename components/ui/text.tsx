import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { Typography } from '@/constants/colors';
import { useThemedColors } from '@/hooks/use-themed-colors';

interface TextProps extends RNTextProps {
  variant?: 'display' | 'body' | 'bodyItalic' | 'ui' | 'uiBold';
  color?: 'primary' | 'secondary' | 'accent' | 'inverse';
}

/**
 * Text component with Oda typography presets — theme-aware.
 */
export function Text({ 
  variant = 'body', 
  color = 'primary',
  style, 
  ...props 
}: TextProps) {
  const C = useThemedColors();
  const fontFamily = Typography.fontFamily[variant];
  
  const textColor = {
    primary: C.text.primary,
    secondary: C.text.secondary,
    accent: C.wax,
    inverse: C.text.inverse,
  }[color];

  return (
    <RNText
      style={[{ fontFamily, color: textColor }, style]}
      {...props}
    />
  );
}
