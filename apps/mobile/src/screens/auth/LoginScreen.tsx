import type { LoginResponse } from '@gasela/shared-types';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, ErrorBanner, GaselaLogo, TextField } from '../../components/ui';
import { ApiError } from '../../services/api-client';
import { api } from '../../services/api-client';
import { useAuthStore } from '../../store/auth-store';

export function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const session = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setSession(session);
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
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrapper}>
          <GaselaLogo size="lg" showText={true} />
        </View>
        <Text style={styles.subtitle}>Masuk menggunakan akun karyawan Anda.</Text>

        <View style={styles.form}>
          {error && <ErrorBanner message={error} />}
          <TextField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="mis. employee"
            autoCapitalize="none"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <Button title="Masuk" onPress={handleLogin} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafafa' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#18181b', textAlign: 'center' },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 28,
  },
  form: { gap: 0 },
});
