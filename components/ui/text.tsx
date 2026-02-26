import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { Colors, Typography } from '@/constants/colors';

interface TextProps extends RNTextProps {
  variant?: 'display' | 'body' | 'bodyItalic' | 'ui' | 'uiBold';
  color?: 'primary' | 'secondary' | 'accent' | 'inverse';
}

/**
 * Text component with Oda typography presets
 */
export function Text({ 
  variant = 'body', 
  color = 'primary',
  style, 
  ...props 
}: TextProps) {
  const fontFamily = Typography.fontFamily[variant];
  
  const textColor = {
    primary: Colors.text.primary,
    secondary: Colors.text.secondary,
    accent: Colors.wax,
    inverse: Colors.text.inverse,
  }[color];

  return (
    <RNText
      style={[
        {
          fontFamily,
          color: textColor,
        },
        style,
      ]}
      {...props}
    />
  );
}
