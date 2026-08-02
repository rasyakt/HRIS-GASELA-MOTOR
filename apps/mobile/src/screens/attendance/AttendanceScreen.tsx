import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DashboardSummary, Paginated } from '@gasela/shared-types';
import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, CardTitle, ErrorBanner, Row, StatusBadge } from '../../components/ui';
import { fmtDate, fmtHours, fmtTime, OFFICE_LOCATION } from '../../lib/format';
import { useAuthApi } from '../../services/auth-api';
import { getPosition } from '../../services/location';

interface AttendanceRow {
  id: number;
  attendanceDate: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workHours: number | string | null;
  lateMinutes?: number | null;
  shift?: { id: number; name: string } | null;
}

export function AttendanceScreen() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [geoFallback, setGeoFallback] = useState(false);
  const [actionLoading, setActionLoading] = useState<'in' | 'out' | null>(null);

  const dashboard = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => authApi<DashboardSummary>('/api/dashboard/summary'),
  });

  const history = useQuery({
    queryKey: ['attendance-my'],
    queryFn: () =>
      authApi<Paginated<AttendanceRow>>('/api/attendances/my?page=1&limit=20'),
  });

  useFocusEffect(
    useCallback(() => {
      dashboard.refetch();
      history.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  async function handleCheck(kind: 'in' | 'out') {
    setActionError(null);
    setActionLoading(kind);
    try {
      const pos = await getPosition();
      setGeoFallback(pos.fallback);
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

  const today = dashboard.data?.today.attendance ?? null;
  const rows = history.data?.items ?? [];
  const loading = dashboard.isLoading || history.isLoading;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => {
            dashboard.refetch();
            history.refetch();
          }}
          tintColor="#18181b"
        />
      }
    >
      <Text style={styles.header}>Kehadiran</Text>
      <Text style={styles.subheader}>
        {new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Text>

      <Card style={styles.card}>
        <CardTitle>Hari Ini</CardTitle>
        {today ? (
          <View>
            <StatusBadge status={today.status} />
            <Row label="Check-in" value={fmtTime(today.checkInTime)} big />
            <Row label="Check-out" value={fmtTime(today.checkOutTime)} big />
            <Row label="Keterlambatan" value={today.lateMinutes > 0 ? `${today.lateMinutes} menit` : 'Tepat waktu'} />
            <Row label="Jam kerja" value={`${fmtHours(today.workHours)} jam`} />
            {today.shiftName && <Row label="Shift" value={today.shiftName} />}
            <View style={styles.actionRow}>
              {!today.checkInTime && (
                <Button
                  title="Check-in Sekarang"
                  onPress={() => handleCheck('in')}
                  loading={actionLoading === 'in'}
                />
              )}
              {today.checkInTime && !today.checkOutTime && (
                <Button
                  title="Check-out"
                  onPress={() => handleCheck('out')}
                  loading={actionLoading === 'out'}
                />
              )}
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.emptyText}>Belum ada kehadiran hari ini.</Text>
            <Button
              title="Check-in Sekarang"
              onPress={() => handleCheck('in')}
              loading={actionLoading === 'in'}
            />
          </View>
        )}
        {geoFallback && (
          <Text style={styles.note}>
            Lokasi perangkat tidak terdeteksi; memakai koordinat kantor.
          </Text>
        )}
        {actionError && <ErrorBanner message={actionError} />}
      </Card>

      <Card style={styles.card}>
        <CardTitle>Riwayat</CardTitle>
        {rows.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada riwayat kehadiran.</Text>
        ) : (
          rows.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowDate}>{fmtDate(r.attendanceDate)}</Text>
                <Text style={styles.rowTime}>
                  {fmtTime(r.checkInTime)} – {fmtTime(r.checkOutTime)} ·{' '}
                  {fmtHours(r.workHours)} jam
                  {r.lateMinutes && r.lateMinutes > 0 ? ` · telat ${r.lateMinutes}m` : ''}
                </Text>
              </View>
              <StatusBadge status={r.status} />
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafafa' },
  container: { padding: 16, paddingBottom: 32 },
  header: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  subheader: { fontSize: 13, color: '#71717a', marginTop: 2, marginBottom: 16 },
  card: { marginBottom: 12 },
  actionRow: { marginTop: 12 },
  emptyText: { color: '#71717a', fontSize: 14, marginBottom: 12 },
  note: { fontSize: 12, color: '#a1a1aa', marginTop: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowDate: { fontSize: 14, fontWeight: '600', color: '#18181b' },
  rowTime: { fontSize: 12, color: '#71717a', marginTop: 2 },
});
