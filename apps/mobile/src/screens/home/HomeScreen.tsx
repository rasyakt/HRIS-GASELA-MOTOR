import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DashboardSummary } from '@gasela/shared-types';
import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, CardTitle, ErrorBanner, Row, StatusBadge } from '../../components/ui';
import { fmtDate, fmtHours, fmtTime, ROLE_LABEL } from '../../lib/format';
import { useAuthApi } from '../../services/auth-api';
import { getPosition } from '../../services/location';
import { useAuthStore } from '../../store/auth-store';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

function QuickAction({ icon, label, onPress, color }: { icon: any; label: string; onPress: () => void; color: string }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<NavProp>();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'in' | 'out' | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => authApi<DashboardSummary>('/api/dashboard/summary'),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  async function handleCheck(kind: 'in' | 'out') {
    setActionError(null);
    setActionLoading(kind);
    try {
      const pos = await getPosition();
      await authApi(`/api/attendances/check-${kind}`, {
        method: 'POST',
        body: JSON.stringify({ latitude: pos.latitude, longitude: pos.longitude }),
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-my'] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal memproses kehadiran.');
    } finally {
      setActionLoading(null);
    }
  }

  const today = data?.today.attendance ?? null;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0f172a" />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Halo, {user?.fullName ?? 'Karyawan'}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {user ? ` · ${ROLE_LABEL[user.role]}` : ''}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#ffffff" />
        </View>
      </View>

      {isError && <ErrorBanner message="Gagal memuat data. Tarik untuk muat ulang." />}

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Kehadiran Hari Ini</Text>
        {today ? (
          <View style={styles.heroContent}>
            <View style={styles.heroRow}>
              <StatusBadge status={today.status} />
              {today.shiftName && <Text style={styles.heroShift}>{today.shiftName}</Text>}
            </View>
            <View style={styles.heroTimes}>
              <View style={styles.heroTimeBlock}>
                <Text style={styles.heroTimeLabel}>Check-in</Text>
                <Text style={styles.heroTimeValue}>{fmtTime(today.checkInTime)}</Text>
              </View>
              <View style={styles.heroTimeDivider} />
              <View style={styles.heroTimeBlock}>
                <Text style={styles.heroTimeLabel}>Check-out</Text>
                <Text style={styles.heroTimeValue}>{fmtTime(today.checkOutTime)}</Text>
              </View>
            </View>
            <View style={styles.heroActionRow}>
              {!today.checkInTime && (
                <Button title="Check-in Sekarang" onPress={() => handleCheck('in')} loading={actionLoading === 'in'} style={styles.heroButton} />
              )}
              {today.checkInTime && !today.checkOutTime && (
                <Button title="Check-out" onPress={() => handleCheck('out')} loading={actionLoading === 'out'} style={styles.heroButton} />
              )}
            </View>
          </View>
        ) : (
          <View style={styles.heroEmpty}>
            <Text style={styles.heroEmptyText}>Belum ada kehadiran hari ini.</Text>
            <Button title="Check-in Sekarang" onPress={() => handleCheck('in')} loading={actionLoading === 'in'} style={styles.heroButton} />
          </View>
        )}
        {actionError && <ErrorBanner message={actionError} />}
      </View>

      <Text style={styles.sectionTitle}>Menu Utama</Text>
      <View style={styles.grid}>
        <QuickAction icon="time-outline" label="Riwayat" onPress={() => navigation.navigate('Attendance')} color="#3b82f6" />
        <QuickAction icon="calendar-outline" label="Cuti" onPress={() => navigation.navigate('Leave')} color="#10b981" />
        <QuickAction icon="alarm-outline" label="Lembur" onPress={() => navigation.navigate('Overtime')} color="#f59e0b" />
        <QuickAction icon="wallet-outline" label="Slip Gaji" onPress={() => navigation.navigate('Payslip')} color="#8b5cf6" />
      </View>

      <Text style={styles.sectionTitle}>Informasi Anda</Text>
      <Card style={styles.card}>
        <CardTitle>Pengajuan Menunggu</CardTitle>
        <Row label="Cuti" value={`${data?.pendingLeave ?? 0}`} big />
        <Row label="Lembur" value={`${data?.pendingOvertime ?? 0}`} big />
      </Card>

      <Card style={styles.card}>
        <CardTitle>Saldo Cuti</CardTitle>
        {data && data.leaveBalances.length > 0 ? (
          data.leaveBalances.map((b) => (
            <Row key={b.leaveTypeId} label={b.leaveTypeName} value={`sisa ${b.remaining}/${b.quota}`} big />
          ))
        ) : (
          <Text style={styles.emptyText}>Belum ada saldo cuti.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  headerText: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  date: { fontSize: 13, color: '#64748b', marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 28,
  },
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  heroContent: {},
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heroShift: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  heroTimes: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 20 },
  heroTimeBlock: { flex: 1, alignItems: 'center' },
  heroTimeLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  heroTimeValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  heroTimeDivider: { width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 16 },
  heroActionRow: { marginTop: 4 },
  heroButton: { width: '100%', borderRadius: 14 },
  heroEmpty: { alignItems: 'center', paddingVertical: 10 },
  heroEmptyText: { color: '#64748b', fontSize: 14, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  quickAction: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  card: { marginBottom: 16 },
  emptyText: { color: '#64748b', fontSize: 14, marginBottom: 12 },
});
