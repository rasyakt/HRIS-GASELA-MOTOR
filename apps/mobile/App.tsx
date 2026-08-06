import 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/auth-store';
import { OfflineBanner } from './src/components/OfflineBanner';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

// Suppress Reanimated reduced motion warning in development
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Reduced motion setting is enabled')
    ) {
      return;
    }
    originalWarn(...args);
  };
}

function AppContent({ loggedIn }: { loggedIn: boolean }) {
  const { theme, tokens } = useTheme();

  const navigationTheme = useMemo(() => {
    const isDark = theme === 'dark';
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    return {
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: tokens.colors.primary,
        background: tokens.colors.background,
        card: tokens.colors.surface,
        text: tokens.colors.textPrimary,
        border: tokens.colors.border,
      },
      fonts: baseTheme.fonts,
    };
  }, [theme, tokens]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <OfflineBanner />
      <RootNavigator loggedIn={loggedIn} />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
    [],
  );

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#18181b" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppContent loggedIn={!!accessToken} />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
});
