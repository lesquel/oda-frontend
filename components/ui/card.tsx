import { View, ViewProps } from 'react-native';
import { Colors, Shadows } from '@/constants/colors';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated';
  children: React.ReactNode;
}

/**
 * Card component following Oda's paper aesthetic
 * Used for poem cards, profile sections, etc.
 */
export function Card({ variant = 'default', children, style, ...props }: CardProps) {
  const baseStyles = {
    backgroundColor: Colors.surface,
    borderRadius: 2, // Minimal radius for paper-like feel
    overflow: 'hidden' as const,
  };

  const variantStyles = variant === 'elevated' ? Shadows.lift : {};

  return (
    <View style={[baseStyles, variantStyles, style]} {...props}>
      {children}
    </View>
  );
}
