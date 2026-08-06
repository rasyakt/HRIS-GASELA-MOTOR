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
import { ROLE_LABEL, fmtDate } from '../../lib/format';
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
  const authApi = useAuthApi();

  // Animations
  const headerOpacity = useSharedValue(0);
  const listOpacity1 = useSharedValue(0);
  const listOpacity2 = useSharedValue(0);
  const listOpacity3 = useSharedValue(0);
  const listOpacity4 = useSharedValue(0);
  const listOpacity5 = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, timingConfig(AnimationDurations.slow));
    listOpacity1.value = withDelay(100, withTiming(1, timingConfig(AnimationDurations.normal)));
    listOpacity2.value = withDelay(200, withTiming(1, timingConfig(AnimationDurations.normal)));
    listOpacity3.value = withDelay(300, withTiming(1, timingConfig(AnimationDurations.normal)));
    listOpacity4.value = withDelay(400, withTiming(1, timingConfig(AnimationDurations.normal)));
    listOpacity5.value = withDelay(500, withTiming(1, timingConfig(AnimationDurations.normal)));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const listStyle1 = useAnimatedStyle(() => ({ opacity: listOpacity1.value }));
  const listStyle2 = useAnimatedStyle(() => ({ opacity: listOpacity2.value }));
  const listStyle3 = useAnimatedStyle(() => ({ opacity: listOpacity3.value }));
  const listStyle4 = useAnimatedStyle(() => ({ opacity: listOpacity4.value }));
  const listStyle5 = useAnimatedStyle(() => ({ opacity: listOpacity5.value }));

  // Query self employee details
  const employeeQuery = useQuery({
    queryKey: ['my-employee', user?.employeeId],
    queryFn: () => authApi<any>(`/api/employees/${user?.employeeId}`),
    enabled: !!user?.employeeId,
  });

  // Query self leave balances
  const leaveBalancesQuery = useQuery({
    queryKey: ['my-leave-balances'],
    queryFn: () => authApi<any[]>('/api/leaves/balances/my'),
  });

  function confirmLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar dari aplikasi?', [
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
            // tetap lanjut keluar meski server error
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

  return (
    <View style={[styles.flex, { backgroundColor: tokens.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.container}
        style={styles.flex}
        showsVerticalScrollIndicator={false}
      >
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
                style={{ marginBottom: 16 }} 
              />
              <Text style={[styles.userName, { color: tokens.colors.textInverse }]}>
                {user?.fullName ?? '—'}
              </Text>
              <Text style={[styles.userRole, { color: tokens.colors.textInverse + 'CC' }]}>
                {user ? (ROLE_LABEL[user.role] ?? user.role) : '—'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {employeeQuery.isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        ) : (
          <>
            {/* Informasi Pribadi Karyawan */}
            <Animated.View style={[styles.cardWrapper, listStyle1]}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Informasi Pribadi Karyawan</Text>
              <Card variant="default">
                <CardContent noPadding>
                  <ListItem
                    icon="person-outline"
                    title="Nama Lengkap"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.fullName ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="card-outline"
                    title="NIK (Nomor Induk)"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.employeeNumber ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="mail-outline"
                    title="Email Pribadi"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.email ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="call-outline"
                    title="Nomor Telepon"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.phone ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="calendar-outline"
                    title="Tanggal Lahir"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{fmtDate(emp?.birthDate)}</Text>}
                  />
                  <ListItem
                    icon="document-text-outline"
                    title="Nomor KTP"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.idCardNumber ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="receipt-outline"
                    title="NPWP"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.taxNumber ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="map-outline"
                    title="Alamat Domisili"
                    trailing={<Text style={{ color: tokens.colors.textSecondary, maxWidth: '60%', textAlign: 'right' }} numberOfLines={2}>{emp?.address ?? '—'}</Text>}
                    hasDivider={false}
                  />
                </CardContent>
              </Card>
            </Animated.View>

            {/* Informasi Pekerjaan */}
            <Animated.View style={[styles.cardWrapper, listStyle2]}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Informasi Pekerjaan</Text>
              <Card variant="default">
                <CardContent noPadding>
                  <ListItem
                    icon="business-outline"
                    title="Departemen"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.department?.name ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="briefcase-outline"
                    title="Posisi / Jabatan"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.position?.name ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="shield-checkmark-outline"
                    title="Status & Tipe Kerja"
                    trailing={
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {emp?.employmentStatus && (
                          <Badge variant="subtle" color="info">
                            {emp.employmentStatus}
                          </Badge>
                        )}
                        {emp?.employmentType && (
                          <Badge variant="subtle" color="neutral">
                            {emp.employmentType}
                          </Badge>
                        )}
                      </View>
                    }
                  />
                  <ListItem
                    icon="today-outline"
                    title="Tanggal Bergabung"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{fmtDate(emp?.joinDate)}</Text>}
                    hasDivider={false}
                  />
                </CardContent>
              </Card>
            </Animated.View>

            {/* Rekening Bank */}
            <Animated.View style={[styles.cardWrapper, listStyle3]}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Rekening Bank</Text>
              <Card variant="default">
                <CardContent noPadding>
                  <ListItem
                    icon="wallet-outline"
                    title="Nama Bank"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.bankName ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="person-circle-outline"
                    title="Nama Pemilik"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.bankAccountName ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="card-outline"
                    title="Nomor Rekening"
                    trailing={<Text style={{ color: tokens.colors.textPrimary, fontWeight: '700', letterSpacing: 0.5 }}>{emp?.bankAccountNumber ?? '—'}</Text>}
                    hasDivider={false}
                  />
                </CardContent>
              </Card>
            </Animated.View>

            {/* Saldo Cuti */}
            {leaveBalancesQuery.data && leaveBalancesQuery.data.length > 0 && (
              <Animated.View style={[styles.cardWrapper, listStyle4]}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Saldo & Kuota Cuti ({new Date().getFullYear()})</Text>
                <Card variant="default">
                  <CardContent>
                    <View style={{ gap: 16, paddingVertical: 8 }}>
                      {leaveBalancesQuery.data.map((bal: any) => {
                        const quota = Number(bal.quota) || 1;
                        const used = Number(bal.used) || 0;
                        const remaining = Number(bal.remaining) || 0;
                        const pct = Math.min(100, (used / quota) * 100);
                        return (
                          <View key={bal.leaveTypeId}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.colors.textPrimary }}>
                                {bal.leaveType?.name ?? 'Cuti'}
                              </Text>
                              <Badge variant="subtle" color="success">
                                {`Sisa ${remaining} Hari`}
                              </Badge>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ fontSize: 12, color: tokens.colors.textSecondary }}>Kuota: {quota} Hari</Text>
                              <Text style={{ fontSize: 12, color: tokens.colors.textSecondary }}>Terpakai: {used} Hari</Text>
                            </View>
                            <View style={{ height: 6, width: '100%', borderRadius: 3, backgroundColor: tokens.colors.neutral200, overflow: 'hidden' }}>
                              <View style={{ height: '100%', width: `${pct}%`, borderRadius: 3, backgroundColor: tokens.colors.success }} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </CardContent>
                </Card>
              </Animated.View>
            )}

            {/* Pengaturan & Keamanan */}
            <Animated.View style={[styles.cardWrapper, listStyle5]}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Pengaturan & Keamanan</Text>
              <Card variant="default">
                <CardContent noPadding>
                  <ListItem
                    icon={theme === 'dark' ? 'moon' : 'sunny'}
                    title="Mode Gelap"
                    subtitle="Tema antarmuka aplikasi"
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
                    trailing={<Ionicons name="chevron-forward" size={20} color={tokens.colors.textTertiary} />}
                  />
                </CardContent>
              </Card>
            </Animated.View>

            {/* Keluar Akun */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { 
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginHorizontal: -20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    fontWeight: '500',
  },
  cardWrapper: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  themeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    marginTop: 8,
  }
});
