import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  CormorantGaramond_700Bold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  EBGaramond_400Regular,
  EBGaramond_400Regular_Italic,
} from '@expo-google-fonts/eb-garamond';
import {
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useThemeStore } from '@/store/theme-store';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_700Bold_Italic,
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { theme } = useThemeStore();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Route guard: only redirect already-authenticated users away from auth screens.
  // Unauthenticated users may browse the feed freely; individual screens gate
  // write-actions (like, compose, profile) themselves.
  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const onAuthScreen =
      segments[0] === 'login' || segments[0] === 'register';

    if (isAuthenticated && onAuthScreen) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="poem/[id]" />
        <Stack.Screen name="user/[username]" />
        <Stack.Screen name="profile/[username]" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
