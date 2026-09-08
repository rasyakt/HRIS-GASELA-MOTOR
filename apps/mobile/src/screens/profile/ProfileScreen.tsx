import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/Button';
import { Card, CardContent } from '../../components/Card';
import { ListItem } from '../../components/ListItem';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { ChangePasswordModal } from './ChangePasswordModal';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { ROLE_LABEL, fmtDate, maskBankAccount, maskPhone, maskEmail } from '../../lib/format';
import { api } from '../../services/api-client';
import { useAuthStore } from '../../store/auth-store';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthApi } from '../../services/auth-api';
import { useQuery } from '@tanstack/react-query';
import { AnimationDurations, timingConfig } from '../../animations';
import { Ionicons } from '@expo/vector-icons';

export function ProfileScreen() {
  const { tokens, theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBankAccount, setShowBankAccount] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const authApi = useAuthApi();

  // Animations
  const headerOpacity = useSharedValue(0);
  const listOpacity1 = useSharedValue(0);
  const listOpacity2 = useSharedValue(0);
  const listOpacity3 = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, timingConfig(AnimationDurations.slow));
    listOpacity1.value = withDelay(100, withTiming(1, timingConfig(AnimationDurations.normal)));
    listOpacity2.value = withDelay(200, withTiming(1, timingConfig(AnimationDurations.normal)));
    listOpacity3.value = withDelay(300, withTiming(1, timingConfig(AnimationDurations.normal)));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const listStyle1 = useAnimatedStyle(() => ({ opacity: listOpacity1.value }));
  const listStyle2 = useAnimatedStyle(() => ({ opacity: listOpacity2.value }));
  const listStyle3 = useAnimatedStyle(() => ({ opacity: listOpacity3.value }));

  // Query self employee details
  const employeeQuery = useQuery({
    queryKey: ['my-employee', user?.employeeId],
    queryFn: () => authApi<any>(`/api/employees/${user?.employeeId}`),
    enabled: !!user?.employeeId,
  });

  function confirmLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun HRIS?', [
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
            // tetap keluar
          } finally {
            clearSession();
          }
        },
      },
    ]);
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const emp = employeeQuery.data;
  const positionName = emp?.position?.name || (user ? (ROLE_LABEL[user.role] ?? user.role) : 'Karyawan');
  const departmentName = emp?.department?.name;
  const employeeNo = emp?.employeeNumber;

  return (
    <View style={[styles.flex, { backgroundColor: tokens.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        style={styles.flex}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Profil Ringkas & Elegan */}
        <Animated.View style={headerStyle}>
          <LinearGradient
            colors={tokens.gradients.primary as [string, string, ...string[]]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <Avatar
                name={user?.fullName ?? '?'}
                size="xl"
                border
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.userName, { color: tokens.colors.textInverse }]}>
                {user?.fullName ?? '—'}
              </Text>

              {/* Sub-badge Ringkas: Posisi & Departemen */}
              <View style={styles.roleBadgeRow}>
                <View style={[styles.customPill, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>
                    {positionName} {departmentName ? `• ${departmentName}` : ''}
                  </Text>
                </View>
                {employeeNo && (
                  <View style={[styles.customPill, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <Text style={{ color: '#ffffff', fontSize: 11 }}>{employeeNo}</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {employeeQuery.isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        ) : (
          <>
            {/* Kartu 1: Informasi Kontak & Kerja (Hanya Data Penting & Terisi) */}
            <Animated.View style={[styles.cardWrapper, listStyle1]}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Informasi Kontak & Pekerjaan</Text>
              <Card variant="default">
                <CardContent noPadding>
                  <ListItem
                    icon="mail-outline"
                    title="Email"
                    onPress={() => setShowEmail(!showEmail)}
                    trailing={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: tokens.colors.textSecondary }}>
                          {showEmail ? (emp?.email ?? '—') : maskEmail(emp?.email)}
                        </Text>
                        {emp?.email && (
                          <Ionicons
                            name={showEmail ? 'eye-off-outline' : 'eye-outline'}
                            size={16}
                            color={tokens.colors.textSecondary}
                          />
                        )}
                      </View>
                    }
                  />
                  {emp?.phone && (
                    <ListItem
                      icon="call-outline"
                      title="Nomor Telepon"
                      onPress={() => setShowPhone(!showPhone)}
                      trailing={
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: tokens.colors.textSecondary }}>
                            {showPhone ? emp.phone : maskPhone(emp.phone)}
                          </Text>
                          <Ionicons
                            name={showPhone ? 'eye-off-outline' : 'eye-outline'}
                            size={16}
                            color={tokens.colors.textSecondary}
                          />
                        </View>
                      }
                    />
                  )}
                  {emp?.joinDate && (
                    <ListItem
                      icon="today-outline"
                      title="Tanggal Bergabung"
                      trailing={<Text style={{ color: tokens.colors.textSecondary }}>{fmtDate(emp.joinDate)}</Text>}
                    />
                  )}
                  <ListItem
                    icon="shield-checkmark-outline"
                    title="Status Karyawan"
                    trailing={
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Badge variant="subtle" color="info">
                          {emp?.employmentStatus ?? 'Aktif'}
                        </Badge>
                        {emp?.employmentType && (
                          <Badge variant="subtle" color="neutral">
                            {emp.employmentType}
                          </Badge>
                        )}
                      </View>
                    }
                  />
                  <ListItem
                    icon="id-card-outline"
                    title="Informasi Pribadi"
                    subtitle="Detail Biodata & Berkas Pribadi"
                    onPress={() => setShowDetailModal(true)}
                    hasDivider={false}
                    trailing={<Ionicons name="chevron-forward" size={18} color={tokens.colors.primary} />}
                  />
                </CardContent>
              </Card>
            </Animated.View>

            {/* Kartu 2: Rekening Bank (Jika Ada) */}
            {emp?.bankAccountNumber && (
              <Animated.View style={[styles.cardWrapper, listStyle2]}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Rekening Payroll</Text>
                <Card variant="default">
                  <CardContent noPadding>
                    <ListItem
                      icon="wallet-outline"
                      title={emp?.bankName ? `Bank ${emp.bankName}` : 'Rekening Bank'}
                      subtitle={emp?.bankAccountName ? `a.n. ${emp.bankAccountName}` : undefined}
                      onPress={() => setShowBankAccount(!showBankAccount)}
                      trailing={
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: tokens.colors.textPrimary, fontWeight: '700', letterSpacing: 0.5 }}>
                            {showBankAccount ? emp.bankAccountNumber : maskBankAccount(emp.bankAccountNumber)}
                          </Text>
                          <Ionicons
                            name={showBankAccount ? 'eye-off-outline' : 'eye-outline'}
                            size={16}
                            color={tokens.colors.primary}
                          />
                        </View>
                      }
                      hasDivider={false}
                    />
                  </CardContent>
                </Card>
              </Animated.View>
            )}

            {/* Kartu 3: Pengaturan Akun & Keamanan */}
            <Animated.View style={[styles.cardWrapper, listStyle3]}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Pengaturan & Keamanan</Text>
              <Card variant="default">
                <CardContent noPadding>
                  <ListItem
                    icon={theme === 'dark' ? 'moon-outline' : 'sunny-outline'}
                    title="Mode Gelap"
                    subtitle="Tampilan tema antarmuka"
                    onPress={toggleTheme}
                    trailing={
                      <View style={[
                        styles.themeToggle,
                        {
                          backgroundColor: theme === 'dark' ? tokens.colors.primary : tokens.colors.neutral200,
                        }
                      ]}>
                        <Text style={{
                          color: theme === 'dark' ? '#ffffff' : tokens.colors.textPrimary,
                          fontWeight: '600',
                          fontSize: 12
                        }}>
                          {theme === 'dark' ? 'ON' : 'OFF'}
                        </Text>
                      </View>
                    }
                  />
                  <ListItem
                    icon="lock-closed-outline"
                    title="Ubah Password"
                    onPress={() => setShowChangePasswordModal(true)}
                    hasDivider={false}
                    trailing={<Ionicons name="chevron-forward" size={18} color={tokens.colors.textTertiary} />}
                  />
                </CardContent>
              </Card>
            </Animated.View>

            {/* Tombol Keluar Akun */}
            <Animated.View style={styles.buttonWrapper}>
              <Button
                variant="destructive"
                onPress={confirmLogout}
                icon="log-out-outline"
                fullWidth
                size="large"
              >
                Keluar dari Akun
              </Button>
            </Animated.View>
          </>
        )}
      </ScrollView>

      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        accessToken={accessToken}
      />

      <EmployeeDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        emp={emp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 130, // Cukup lega agar tidak tertutup bottom tab bar
  },
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginHorizontal: -20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  customPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  themeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    marginTop: 12,
  },
});
