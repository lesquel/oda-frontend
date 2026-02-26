import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Button, Input, Text } from '@/components/ui';
import { Colors, Spacing } from '@/constants/colors';
import { useAuthStore } from '../store/auth-store';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async () => {
    clearError();

    // Validation
    if (!email || !username || !name || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await register({ email, username, name, password });
      router.replace('/(tabs)');
    } catch (err) {
      // Error is set in store
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: Colors.paper,
          justifyContent: 'center',
          padding: Spacing['2xl'],
        }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
          <Text
            variant="display"
            style={{
              fontSize: 48,
              letterSpacing: 2,
              marginBottom: Spacing.sm,
            }}
          >
            ODA
          </Text>
          <Text variant="ui" color="secondary" style={{ fontSize: 11, letterSpacing: 2 }}>
            CREATE YOUR POET ACCOUNT
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View
            style={{
              backgroundColor: `${Colors.wax}15`,
              padding: Spacing.md,
              borderRadius: 2,
              marginBottom: Spacing.md,
            }}
          >
            <Text variant="ui" color="accent" style={{ fontSize: 12 }}>
              {error}
            </Text>
          </View>
        )}

        {/* Register Form */}
        <View style={{ marginBottom: Spacing.lg }}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your Name"
            editable={!isLoading}
          />

          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="poetwarrior"
            editable={!isLoading}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="poet@example.com"
            editable={!isLoading}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            editable={!isLoading}
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
            editable={!isLoading}
          />

          <Button
            variant="primary"
            size="lg"
            onPress={handleRegister}
            loading={isLoading}
            style={{ marginTop: Spacing.md }}
          >
            Register
          </Button>
        </View>

        {/* Login Link */}
        <View style={{ alignItems: 'center' }}>
          <Text variant="ui" color="secondary" style={{ fontSize: 12, marginBottom: Spacing.xs }}>
            Already have an account?
          </Text>
          <Link href="/login" asChild>
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
