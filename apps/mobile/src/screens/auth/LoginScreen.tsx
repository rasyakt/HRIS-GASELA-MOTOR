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
import { savedCredentialsStore } from '../../services/storage';
import { useTheme } from '../../theme/ThemeProvider';
import { AnimationDurations, timingConfig } from '../../animations';

export function LoginScreen() {
  const { tokens } = useTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [hasSavedAccount, setHasSavedAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Animations
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const formTranslateY = useSharedValue(100);
  const formOpacity = useSharedValue(0);

  // Muat akun & password tersimpan saat screen dibuka
  useEffect(() => {
    async function loadSavedCredentials() {
      const saved = await savedCredentialsStore.getCredentials();
      if (saved && saved.username) {
        setUsername(saved.username);
        if (saved.password) {
          setPassword(saved.password);
        }
        setRememberMe(true);
        setHasSavedAccount(true);
      }
    }
    loadSavedCredentials();
  }, []);

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
        // Simpan / hapus akun tersimpan berdasarkan pilihan 'Ingat Saya'
        if (rememberMe) {
          await savedCredentialsStore.saveCredentials({
            username: cleanUsername,
            password: cleanPassword,
          });
        } else {
          await savedCredentialsStore.clearCredentials();
        }

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

  async function handleClearSavedAccount() {
    await savedCredentialsStore.clearCredentials();
    setUsername('');
    setPassword('');
    setRememberMe(false);
    setHasSavedAccount(false);
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

              {hasSavedAccount && (
                <View style={[styles.savedAccountBanner, { backgroundColor: tokens.colors.primaryLight + '15', borderColor: tokens.colors.primaryLight + '40' }]}>
                  <Ionicons name="key-outline" size={16} color={tokens.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.savedAccountText, { color: tokens.colors.textPrimary }]}>
                    Akun tersimpan diisi otomatis
                  </Text>
                  <Pressable onPress={handleClearSavedAccount} style={styles.clearSavedBtn}>
                    <Text style={[styles.clearSavedText, { color: tokens.colors.error }]}>Hapus</Text>
                  </Pressable>
                </View>
              )}
              
              <Input
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="mis. employee"
                autoCapitalize="none"
                autoComplete="username"
                textContentType="username"
                importantForAutofill="yes"
                prefixIcon="person-outline"
                containerStyle={styles.inputSpacing}
              />
              
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                importantForAutofill="yes"
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
  savedAccountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  savedAccountText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  clearSavedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearSavedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 8,
  },
});
