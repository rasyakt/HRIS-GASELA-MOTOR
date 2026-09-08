import React, { useState, useMemo } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/Button';
import { api, ApiError } from '../../services/api-client';
import type { LoginResponse } from '@gasela/shared-types';

export function ForceChangePasswordScreen() {
  const { tokens } = useTheme();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live checklist validation
  const rules = useMemo(() => {
    const hasMinLength = newPassword.length >= 12;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
    const notRepeated = !/(.)\1{5,}/.test(newPassword);

    const isNotDefaultOrOld =
      Boolean(newPassword) &&
      newPassword.toLowerCase() !== 'gasela123!' &&
      newPassword !== oldPassword;

    const usernameLower = (user?.username || '').trim().toLowerCase();
    const notContainUsername =
      !usernameLower ||
      usernameLower.length < 3 ||
      !newPassword.toLowerCase().includes(usernameLower);

    const confirmMatches =
      Boolean(newPassword) &&
      Boolean(confirmPassword) &&
      newPassword === confirmPassword;

    return {
      hasMinLength,
      hasCombo: hasUpper && hasLower && hasNumber && hasSymbol,
      notRepeated,
      isNotDefaultOrOld,
      notContainUsername,
      confirmMatches,
    };
  }, [newPassword, oldPassword, confirmPassword, user?.username]);

  // Password strength
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: tokens.colors.neutral300 };

    let passed = 0;
    if (rules.hasMinLength) passed++;
    if (rules.hasCombo) passed++;
    if (rules.isNotDefaultOrOld && rules.notContainUsername && rules.notRepeated) passed++;

    if (passed <= 1) {
      return { score: 0.33, label: 'Lemah', color: '#EF4444' };
    }
    if (passed === 2) {
      return { score: 0.66, label: 'Cukup', color: '#F59E0B' };
    }
    return { score: 1.0, label: 'Sangat Kuat', color: '#10B981' };
  }, [newPassword, rules, tokens]);

  const allRulesPassed =
    rules.hasMinLength &&
    rules.hasCombo &&
    rules.notRepeated &&
    rules.isNotDefaultOrOld &&
    rules.notContainUsername &&
    rules.confirmMatches &&
    Boolean(oldPassword.trim());

  const handleSubmit = async () => {
    if (!allRulesPassed || loading) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await api<LoginResponse>('/api/auth/change-password', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({
          oldPassword: oldPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      Alert.alert(
        'Berhasil',
        'Password Anda berhasil diperbarui! Selamat datang di GaselaPulse.',
        [
          {
            text: 'Masuk ke Aplikasi',
            onPress: () => {
              if (response && response.accessToken && response.user) {
                setSession({
                  accessToken: response.accessToken,
                  refreshToken: response.refreshToken || '',
                  user: response.user,
                  expiresIn: response.expiresIn || 900,
                });
              }
            },
          },
        ],
      );
    } catch (err: any) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Gagal mengubah password. Periksa kembali input Anda.';
      setErrorMsg(msg);
      Alert.alert('Gagal Mengubah Password', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Batalkan & Keluar',
      'Apakah Anda yakin ingin keluar dari akun ini? Anda harus login kembali nantinya.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (accessToken) {
                await api('/api/auth/logout', { method: 'POST', token: accessToken });
              }
            } catch {
              // ignore
            } finally {
              clearSession();
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar Logout */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleLogout} style={styles.topLogoutButton}>
              <Ionicons name="log-out-outline" size={16} color={tokens.colors.textSecondary} />
              <Text style={[styles.topLogoutText, { color: tokens.colors.textSecondary }]}>Keluar</Text>
            </TouchableOpacity>
          </View>

          {/* Clean Card Header */}
          <View style={styles.header}>
            <View style={[styles.lockIconBox, { backgroundColor: tokens.colors.primaryLight + '20' }]}>
              <Ionicons name="lock-closed" size={20} color={tokens.colors.primary} />
            </View>
            <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
              Ganti Password Pertama Kali
            </Text>
            <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
              Halo <Text style={{ fontWeight: '700', color: tokens.colors.textPrimary }}>{user?.fullName || user?.username}</Text>, buat password baru yang aman untuk melanjutkan.
            </Text>
          </View>

          {errorMsg && (
            <View style={[styles.errorBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Old Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
                Password Default / Password Lama <Text style={{ color: tokens.colors.error, fontWeight: '700' }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: tokens.colors.surface,
                    borderColor: tokens.colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: tokens.colors.textPrimary }]}
                  placeholder="Password default (contoh: Gasela123!)"
                  placeholderTextColor={tokens.colors.textTertiary}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry={!showOld}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowOld(!showOld)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name={showOld ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={tokens.colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
                Password Baru <Text style={{ color: tokens.colors.error, fontWeight: '700' }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: tokens.colors.surface,
                    borderColor: tokens.colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: tokens.colors.textPrimary }]}
                  placeholder="Minimal 12 karakter kombinasi"
                  placeholderTextColor={tokens.colors.textTertiary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={tokens.colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={[styles.strengthBarBg, { backgroundColor: tokens.colors.border }]}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        {
                          width: `${strength.score * 100}%`,
                          backgroundColor: strength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthValue, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
                Konfirmasi Password Baru <Text style={{ color: tokens.colors.error, fontWeight: '700' }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: tokens.colors.surface,
                    borderColor: tokens.colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: tokens.colors.textPrimary }]}
                  placeholder="Ketik ulang password baru"
                  placeholderTextColor={tokens.colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={tokens.colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Compact Checklist Card */}
            <View
              style={[
                styles.checklistCard,
                {
                  backgroundColor: tokens.colors.surface,
                  borderColor: tokens.colors.border,
                },
              ]}
            >
              <Text style={[styles.checklistTitle, { color: tokens.colors.textTertiary }]}>
                KETENTUAN KEAMANAN
              </Text>
              <CheckRow valid={rules.hasMinLength} label="Minimal 12 karakter" tokens={tokens} />
              <CheckRow valid={rules.hasCombo} label="Kombinasi A-Z, a-z, 0-9, dan simbol (@, #, $, dll)" tokens={tokens} />
              <CheckRow valid={rules.isNotDefaultOrOld} label="Bukan password default atau password lama" tokens={tokens} />
              <CheckRow valid={rules.notContainUsername} label="Tidak memuat NIK/username" tokens={tokens} />
              <CheckRow valid={rules.confirmMatches} label="Konfirmasi password cocok" tokens={tokens} />
            </View>

            {/* Buttons */}
            <View style={styles.actions}>
              <Button
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
                disabled={!allRulesPassed || loading}
                onPress={handleSubmit}
              >
                Simpan Password & Masuk
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CheckRow({
  valid,
  label,
  tokens,
}: {
  valid: boolean;
  label: string;
  tokens: any;
}) {
  return (
    <View style={styles.checkRow}>
      {valid ? (
        <Ionicons name="checkmark-circle" size={15} color="#10B981" />
      ) : (
        <Ionicons name="ellipse-outline" size={15} color={tokens.colors.textTertiary} />
      )}
      <Text
        style={[
          styles.checkLabel,
          {
            color: valid ? tokens.colors.textPrimary : tokens.colors.textTertiary,
            fontWeight: valid ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  topLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  topLogoutText: {
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    marginBottom: 20,
  },
  lockIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '500',
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  checklistCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    marginTop: 2,
  },
  checklistTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkLabel: {
    fontSize: 12,
  },
  actions: {
    marginTop: 6,
  },
});
