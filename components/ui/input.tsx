import { TextInput, Text, View, TextInputProps } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

/**
 * Input component following Oda's minimal aesthetic
 */
export function Input({ label, error, style, ...props }: InputProps) {
  const containerStyles = {
    marginBottom: Spacing.md,
  };

  const labelStyles = {
    fontFamily: Typography.fontFamily.ui,
    fontSize: Typography.fontSize.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    color: Colors.pencil,
    marginBottom: Spacing.xs,
  };

  const inputStyles = {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.lg,
    color: Colors.ink,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: error ? Colors.wax : Colors.border.light,
    borderRadius: 2,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  };

  const errorStyles = {
    fontFamily: Typography.fontFamily.ui,
    fontSize: Typography.fontSize.xs,
    color: Colors.wax,
    marginTop: Spacing.xs,
  };

  return (
    <View style={containerStyles}>
      {label && <Text style={labelStyles}>{label}</Text>}
      <TextInput
        style={[inputStyles, style]}
        placeholderTextColor={Colors.pencil}
        {...props}
      />
      {error && <Text style={errorStyles}>{error}</Text>}
    </View>
  );
}
