import 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/auth-store';
import { OfflineBanner } from './src/components/OfflineBanner';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Suppress Reanimated reduced motion & CameraView warnings in development
LogBox.ignoreLogs([
  '[Reanimated] Reduced motion setting is enabled',
  'Reduced motion setting is enabled on this device',
  'The <CameraView> component does not support children',
]);


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

  useEffect(() => {
    async function checkUpdates() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('Error checking updates:', error);
      }
    }
    checkUpdates();
  }, []);

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

  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isHydrated]);

  if (!isHydrated) {
    return null;
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
