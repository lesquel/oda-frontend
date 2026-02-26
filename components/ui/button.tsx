import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/colors';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: string;
}

/**
 * Button component following Oda's UI design
 * Variants: primary (wax), secondary (outlined), ghost (transparent)
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.wax,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: Colors.ink,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.md,
          minHeight: 32,
        };
      case 'md':
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.lg,
          minHeight: 44,
        };
      case 'lg':
        return {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.xl,
          minHeight: 52,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.pencil;
    switch (variant) {
      case 'primary':
        return Colors.text.inverse;
      case 'secondary':
      case 'ghost':
        return Colors.ink;
    }
  };

  const baseStyles = {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 2,
    ...getVariantStyles(),
    ...getSizeStyles(),
    opacity: disabled ? 0.5 : 1,
  };

  const textStyles = {
    fontFamily: Typography.fontFamily.ui,
    fontSize: size === 'sm' ? Typography.fontSize.sm : Typography.fontSize.base,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    color: getTextColor(),
  };

  return (
    <Pressable
      style={({ pressed }) => [
        baseStyles,
        pressed && { opacity: 0.7 },
        style as any,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </Pressable>
  );
}
