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
import { FaceCameraModal } from '../../components/FaceCameraModal';
import { Button, Card, CardTitle, ErrorBanner, Row, StatusBadge } from '../../components/ui';
import { fmtDate, fmtHours, fmtTime } from '../../lib/format';
import { useAuthApi } from '../../services/auth-api';
import { getPosition, checkGeofence, type Position } from '../../services/location';

import { useTheme } from '../../theme/ThemeProvider';

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
  const { tokens } = useTheme();
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'in' | 'out' | null>(null);
  const [faceModalVisible, setFaceModalVisible] = useState(false);
  const [pendingActionKind, setPendingActionKind] = useState<'in' | 'out'>('in');
  const [capturedPosition, setCapturedPosition] = useState<Position | null>(null);
  const [userDistance, setUserDistance] = useState<{
    dist: number;
    formatted: string;
    isWithin: boolean;
  } | null>(null);

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

  async function initiateCheck(kind: 'in' | 'out') {
    setActionError(null);
    setActionLoading(kind);
    try {
      const office = dashboard.data?.officeLocation;
      let pos: Position;

      if (office && typeof office.lat === 'number' && typeof office.lng === 'number') {
        const check = await checkGeofence(office.lat, office.lng, office.radiusMeters || 500);
        setUserDistance({
          dist: check.distance,
          formatted: check.formattedDistance,
          isWithin: check.isWithinGeofence,
        });
        pos = check.position;

        if (!check.isWithinGeofence) {
          setActionError(
            `Anda berada ${check.formattedDistance} dari kantor (maksimal ${check.radius}m). Anda harus berada di radius kantor untuk melakukan presensi.`
          );
          return;
        }
      } else {
        pos = await getPosition();
      }

      setCapturedPosition(pos);
      setPendingActionKind(kind);
      setFaceModalVisible(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal mendeteksi lokasi perangkat.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleFaceCaptured(photoUrl: string) {
    setActionError(null);
    setActionLoading(pendingActionKind);
    try {
      const pos = capturedPosition ?? (await getPosition());
      await authApi(`/api/attendances/check-${pendingActionKind}`, {
        method: 'POST',
        body: JSON.stringify({
          latitude: pos.latitude,
          longitude: pos.longitude,
          photoUrl,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-my'] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal memproses kehadiran.');
    } finally {
      setActionLoading(null);
      setCapturedPosition(null);
    }
  }

  const today = dashboard.data?.today.attendance ?? null;
  const rows = history.data?.items ?? [];
  const loading = dashboard.isLoading || history.isLoading;

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: tokens.colors.background }]}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => {
            dashboard.refetch();
            history.refetch();
          }}
          tintColor={tokens.colors.primary}
        />
      }
    >
      <Text style={[styles.header, { color: tokens.colors.textPrimary }]}>Kehadiran</Text>
      <Text style={[styles.subheader, { color: tokens.colors.textSecondary }]}>
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
            {dashboard.data?.officeLocation && (
              <Row
                label="Area Presensi"
                value={`${dashboard.data.officeLocation.companyName || 'Kantor'} (Maks. ${dashboard.data.officeLocation.radiusMeters}m)`}
              />
            )}
            {userDistance && (
              <Row
                label="Status Jarak"
                value={`${userDistance.isWithin ? '🟢 Terjangkau' : '🔴 Di Luar'} (${userDistance.formatted})`}
              />
            )}
            <View style={styles.actionRow}>
              {!today.checkInTime && (
                <Button
                  title={actionLoading === 'in' ? 'Memeriksa Lokasi...' : 'Check-in Sekarang'}
                  onPress={() => initiateCheck('in')}
                  loading={actionLoading === 'in'}
                />
              )}
              {today.checkInTime && !today.checkOutTime && (
                <Button
                  title={actionLoading === 'out' ? 'Memeriksa Lokasi...' : 'Check-out'}
                  onPress={() => initiateCheck('out')}
                  loading={actionLoading === 'out'}
                />
              )}
            </View>
          </View>
        ) : (
          <View>
            <Text style={[styles.emptyText, { color: tokens.colors.textSecondary }]}>Belum ada kehadiran hari ini.</Text>
            {dashboard.data?.officeLocation && (
              <Row
                label="Area Presensi"
                value={`${dashboard.data.officeLocation.companyName || 'Kantor'} (Maks. ${dashboard.data.officeLocation.radiusMeters}m)`}
              />
            )}
            {userDistance && (
              <Row
                label="Status Jarak"
                value={`${userDistance.isWithin ? '🟢 Terjangkau' : '🔴 Di Luar'} (${userDistance.formatted})`}
              />
            )}
            <Button
              title={actionLoading === 'in' ? 'Memeriksa Lokasi...' : 'Check-in Sekarang'}
              onPress={() => initiateCheck('in')}
              loading={actionLoading === 'in'}
            />
          </View>
        )}
        {actionError && <ErrorBanner message={actionError} />}
      </Card>

      <Card style={styles.card}>
        <CardTitle>Riwayat</CardTitle>
        {rows.length === 0 ? (
          <Text style={[styles.emptyText, { color: tokens.colors.textSecondary }]}>Belum ada riwayat kehadiran.</Text>
        ) : (
          rows.map((r) => (
            <View key={r.id} style={[styles.row, { borderBottomColor: tokens.colors.border }]}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowDate, { color: tokens.colors.textPrimary }]}>{fmtDate(r.attendanceDate)}</Text>
                <Text style={[styles.rowTime, { color: tokens.colors.textSecondary }]}>
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

      <FaceCameraModal
        visible={faceModalVisible}
        onClose={() => setFaceModalVisible(false)}
        onCapture={handleFaceCaptured}
        actionKind={pendingActionKind}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
