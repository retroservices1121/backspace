import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { colors } from '@/constants/theme';
import { AuthGateProvider, useAuthGate } from '@/auth/auth-gate';
import { AuthProvider } from '@/auth/auth-provider';
import { ApiSessionBridge } from '@/lib/api/session-bridge';

const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: colors.brand2, background: colors.canvas, card: colors.canvas, text: colors.ink, border: colors.line, notification: colors.pink } };

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 2, refetchOnReconnect: true } } }));
  return <AuthProvider><ApiSessionBridge /><QueryClientProvider client={queryClient}><AuthGateProvider><ThemeProvider value={theme}><RootStack /><StatusBar style="light" /></ThemeProvider></AuthGateProvider></QueryClientProvider></AuthProvider>;
}

/**
 * One gate for every route. `index` is always reachable and listed first, so whenever a guard denies a
 * screen (cold start, deep link, back, or a guard flipping to false) Expo Router falls back to it, and
 * it either redirects to the right place or shows the loading/retry state. When a guard turns false,
 * Expo Router also drops that screen's history, so back cannot return to the tabs after sign-out or
 * skip past onboarding.
 */
function RootStack() {
  const { status } = useAuthGate();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: 'slide_from_right' }}>
    <Stack.Screen name="index" options={{ animation: 'fade' }} />
    <Stack.Protected guard={status === 'signed-out'}>
      <Stack.Screen name="sign-in" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack.Protected>
    <Stack.Protected guard={status === 'needs-onboarding'}>
      <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack.Protected>
    <Stack.Protected guard={status === 'ready'}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="market/[id]" />
    </Stack.Protected>
  </Stack>;
}
