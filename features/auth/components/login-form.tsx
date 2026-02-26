import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Button, Input, Text } from '@/components/ui';
import { Colors, Spacing } from '@/constants/colors';
import { useAuthStore } from '../store/auth-store';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    clearError();
    
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login({ email, password });
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
          flex: 1,
          backgroundColor: Colors.paper,
          justifyContent: 'center',
          padding: Spacing['2xl'],
        }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: Spacing['3xl'] }}>
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
            A POETRY SOCIAL NETWORK
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

        {/* Login Form */}
        <View style={{ marginBottom: Spacing.xl }}>
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

          <Button
            variant="primary"
            size="lg"
            onPress={handleLogin}
            loading={isLoading}
            style={{ marginTop: Spacing.md }}
          >
            Login
          </Button>
        </View>

        {/* Register Link */}
        <View style={{ alignItems: 'center' }}>
          <Text variant="ui" color="secondary" style={{ fontSize: 12, marginBottom: Spacing.xs }}>
            Don't have an account?
          </Text>
          <Link href="/register" asChild>
            <Button variant="ghost" size="sm">
              Register
            </Button>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
