import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/auth/auth-provider';

const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: colors.brand2, background: colors.canvas, card: colors.canvas, text: colors.ink, border: colors.line, notification: colors.pink } };
export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 2, refetchOnReconnect: true } } }));
  return <AuthProvider><QueryClientProvider client={queryClient}><ThemeProvider value={theme}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: 'slide_from_right' }}><Stack.Screen name="(tabs)" /><Stack.Screen name="market/[id]" /><Stack.Screen name="sign-in" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} /></Stack><StatusBar style="light" /></ThemeProvider></QueryClientProvider></AuthProvider>;
}
