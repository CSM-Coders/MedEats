// ============================================================
// ROOT LAYOUT (Expo Router)
// ------------------------------------------------------------
// Este archivo envuelve toda la app con providers globales y
// define el stack de navegación principal.
// ============================================================

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/src/context/auth-context';
import { FeedProvider } from '@/src/context/feed-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const isPublicRoute = pathname === '/' || pathname === '/login';

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login' as never);
      return;
    }

    if (isAuthenticated && isPublicRoute) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, pathname, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <FeedProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </FeedProvider>
    </AuthProvider>
  );
}
