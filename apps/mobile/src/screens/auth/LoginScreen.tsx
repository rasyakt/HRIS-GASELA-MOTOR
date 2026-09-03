import type { LoginResponse } from '@gasela/shared-types';
import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GaselaLogo } from '../../components/ui';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card, CardContent } from '../../components/Card';
import { ErrorBanner } from '../../components/ErrorState';
import { ApiError } from '../../services/api-client';
import { api } from '../../services/api-client';
import { useAuthStore } from '../../store/auth-store';
import { useTheme } from '../../theme/ThemeProvider';
import { AnimationDurations, timingConfig } from '../../animations';

export function LoginScreen() {
  const { tokens } = useTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Animations
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const formTranslateY = useSharedValue(100);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, timingConfig(AnimationDurations.slow));
    logoScale.value = withTiming(1, timingConfig(AnimationDurations.slow));
    
    formOpacity.value = withDelay(
      150,
      withTiming(1, timingConfig(350))
    );
    formTranslateY.value = withDelay(
      150,
      withTiming(0, timingConfig(350))
    );
  }, [logoOpacity, logoScale, formOpacity, formTranslateY]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });

  const animatedFormStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateY: formTranslateY.value }],
    };
  });

  async function handleLogin() {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    if (!cleanUsername || !cleanPassword) {
      setError('Username dan password wajib diisi.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const session = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
      });
      if (session.requires2FA) {
        setError('Akun Anda memerlukan verifikasi 2FA. Silakan gunakan Web Portal.');
        return;
      }
      if (session.accessToken && session.refreshToken && session.user) {
        setSession(
          {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            expiresIn: session.expiresIn,
            user: session.user,
          },
          rememberMe,
        );
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Gagal menghubungi server. Periksa koneksi & alamat API.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[tokens.colors.background, tokens.colors.primaryLight + '20']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.logoWrapper, animatedLogoStyle]}>
          <GaselaLogo size="lg" showText={false} />
          <Text style={[styles.welcomeText, { color: tokens.colors.textPrimary }]}>
            Selamat Datang!
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
            Masuk menggunakan akun karyawan Anda.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.formWrapper, animatedFormStyle]}>
          <Card variant="elevated" elevation="lg">
            <CardContent>
              {error && (
                <ErrorBanner 
                  description={error} 
                  onDismiss={() => setError(null)}
                  style={{ marginBottom: 16 }}
                />
              )}
              
              <Input
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="mis. employee"
                autoCapitalize="none"
                prefixIcon="person-outline"
                containerStyle={styles.inputSpacing}
              />
              
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                prefixIcon="lock-closed-outline"
                containerStyle={styles.inputSpacing}
              />

              <View style={styles.rememberMeRow}>
                <Pressable
                  onPress={() => setRememberMe(!rememberMe)}
                  style={styles.checkboxContainer}
                >
                  <Ionicons
                    name={rememberMe ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={rememberMe ? tokens.colors.primary : tokens.colors.textTertiary}
                  />
                  <Text style={[styles.rememberMeText, { color: tokens.colors.textSecondary }]}>
                    Ingat Saya
                  </Text>
                </Pressable>
              </View>
              
              <Button 
                variant="gradient"
                onPress={handleLogin} 
                loading={loading}
                fullWidth
                style={styles.loginButton}
                size="large"
              >
                Masuk
              </Button>
            </CardContent>
          </Card>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    alignSelf: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  formWrapper: {
    width: '100%',
  },
  inputSpacing: {
    marginBottom: 16,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: -4,
    paddingHorizontal: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 8,
  },
});
