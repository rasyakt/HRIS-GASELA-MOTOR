import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DashboardSummary, Paginated } from '@gasela/shared-types';
import { Ionicons } from '@expo/vector-icons';
import { FaceCameraModal } from '../../components/FaceCameraModal';
import { EarlyLeaveModal } from '../../components/EarlyLeaveModal';
import { PhotoModal } from '../../components/PhotoModal';
import { Button } from '../../components/Button';
import { Card, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ErrorBanner } from '../../components/ErrorState';
import { fmtDate, fmtHours, fmtTime, statusLabel } from '../../lib/format';
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
  checkInPhotoUrl?: string | null;
  checkOutPhotoUrl?: string | null;
  checkInLat?: number | null;
  checkInLng?: number | null;
  checkOutLat?: number | null;
  checkOutLng?: number | null;
}

function getBadgeColor(status?: string | null): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  if (!status) return 'neutral';
  switch (status) {
    case 'present':
      return 'success';
    case 'late':
      return 'warning';
    case 'early_leave':
      return 'warning';
    case 'absent':
      return 'error';
    case 'leave':
      return 'info';
    default:
      return 'neutral';
  }
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

  // Modals state
  const [earlyLeaveModalVisible, setEarlyLeaveModalVisible] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [viewPhoto, setViewPhoto] = useState<{ url: string; title: string } | null>(null);

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
    }, [dashboard, history]),
  );

  async function initiateCheck(kind: 'in' | 'out') {
    setActionError(null);

    // Opsi 1: Kunci Check-in Setelah Jam Shift Berakhir
    if (kind === 'in') {
      const shiftInfo = dashboard.data?.today.shift;
      if (shiftInfo?.isEnded) {
        setActionError(
          `Shift ${shiftInfo.name} telah berakhir pada pukul ${fmtTime(shiftInfo.endTime)} WIB. Anda tidak dapat melakukan check-in setelah jam shift selesai.`
        );
        return;
      }
    }

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
            `Anda berada ${check.formattedDistance} dari kantor (maksimal ${check.radius}m). Presensi hanya dapat dilakukan di dalam area kantor.`
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

  function handlePressCheckOut() {
    const todayAtt = dashboard.data?.today.attendance;

    // Cek aturan jam shift & pencegahan check-out instan
    if (todayAtt && todayAtt.canCheckoutNow === false) {
      setEarlyLeaveModalVisible(true);
      return;
    }

    setCheckoutNotes('');
    initiateCheck('out');
  }

  function handleConfirmEarlyLeave(reason: string) {
    setCheckoutNotes(reason);
    setEarlyLeaveModalVisible(false);
    initiateCheck('out');
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
          notes: pendingActionKind === 'out' && checkoutNotes ? checkoutNotes : undefined,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-my'] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal memproses kehadiran.');
    } finally {
      setActionLoading(null);
      setCapturedPosition(null);
      setCheckoutNotes('');
    }
  }

  const today = dashboard.data?.today.attendance ?? null;
  const rows = history.data?.items ?? [];
  const loading = dashboard.isLoading || history.isLoading;

  const todayDateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
      {/* Header Halaman: Minimal & Elegan */}
      <View style={styles.screenHeader}>
        <Text style={[styles.headerTitle, { color: tokens.colors.textPrimary }]}>
          Presensi Kerja
        </Text>
        <Text style={[styles.headerSubtitle, { color: tokens.colors.textSecondary }]}>
          {todayDateFormatted}
        </Text>
      </View>

      {/* Card Utama: Kehadiran Hari Ini (Clean, Professional, Zero Clutter) */}
      <Card style={styles.card} elevation="sm">
        <CardContent>
          {/* Header Card: Status & Shift Pill */}
          <View style={styles.cardTopRow}>
            <View style={styles.shiftMetaGroup}>
              <Ionicons name="business-outline" size={15} color={tokens.colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.shiftMetaText, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
                {today?.shiftName || 'Shift Kerja'}
                {today?.shiftStartTime && today?.shiftEndTime
                  ? ` (${fmtTime(today.shiftStartTime)} – ${fmtTime(today.shiftEndTime)})`
                  : ''}
              </Text>
            </View>

            {today?.status && (
              <Badge variant="subtle" color={getBadgeColor(today.status)}>
                {statusLabel(today.status)}
              </Badge>
            )}
          </View>

          {/* Hero Time Display: Masuk & Keluar dengan Pemisah Elegan */}
          <View style={[styles.timeHeroContainer, { backgroundColor: tokens.colors.neutral50, borderColor: tokens.colors.border }]}>
            {/* Kolom Masuk */}
            <View style={styles.timeHeroColumn}>
              <Text style={[styles.timeHeroLabel, { color: tokens.colors.textSecondary }]}>MASUK</Text>
              <Text style={[styles.timeHeroValue, { color: today?.checkInTime ? tokens.colors.textPrimary : tokens.colors.neutral400 }]}>
                {fmtTime(today?.checkInTime)}
              </Text>
              <View style={styles.timeHeroStatusRow}>
                {today?.lateMinutes && today.lateMinutes > 0 ? (
                  <Text style={[styles.timeHeroSubtext, { color: tokens.colors.error }]}>
                    Telat {today.lateMinutes} mnt
                  </Text>
                ) : today?.checkInTime ? (
                  <Text style={[styles.timeHeroSubtext, { color: tokens.colors.success }]}>
                    Tepat waktu
                  </Text>
                ) : (
                  <Text style={[styles.timeHeroSubtext, { color: tokens.colors.textSecondary }]}>
                    Belum check-in
                  </Text>
                )}
              </View>
            </View>

            {/* Garis Pembatas Vertikal */}
            <View style={[styles.timeHeroDivider, { backgroundColor: tokens.colors.border }]} />

            {/* Kolom Keluar */}
            <View style={styles.timeHeroColumn}>
              <Text style={[styles.timeHeroLabel, { color: tokens.colors.textSecondary }]}>KELUAR</Text>
              <Text style={[styles.timeHeroValue, { color: today?.checkOutTime ? tokens.colors.textPrimary : tokens.colors.neutral400 }]}>
                {fmtTime(today?.checkOutTime)}
              </Text>
              <View style={styles.timeHeroStatusRow}>
                {today?.workHours && Number(today.workHours) > 0 ? (
                  <Text style={[styles.timeHeroSubtext, { color: tokens.colors.primary }]}>
                    {fmtHours(today.workHours)} jam kerja
                  </Text>
                ) : (
                  <Text style={[styles.timeHeroSubtext, { color: tokens.colors.textSecondary }]}>
                    —
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Status Lokasi Kantor / Geofence (Minimalis 1 Baris) */}
          {dashboard.data?.officeLocation && (
            <View style={styles.locationMinimalRow}>
              <View style={styles.locationLeft}>
                <Ionicons name="location-outline" size={14} color={tokens.colors.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.locationText, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
                  {dashboard.data.officeLocation.companyName || 'Kantor'} ({dashboard.data.officeLocation.radiusMeters}m)
                </Text>
              </View>

              {userDistance && (
                <View style={styles.proximityBadge}>
                  <View
                    style={[
                      styles.proximityDot,
                      { backgroundColor: userDistance.isWithin ? tokens.colors.success : tokens.colors.error },
                    ]}
                  />
                  <Text
                    style={[
                      styles.proximityText,
                      { color: userDistance.isWithin ? tokens.colors.success : tokens.colors.error },
                    ]}
                  >
                    {userDistance.isWithin ? 'Terjangkau' : 'Di Luar'} ({userDistance.formatted})
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Warning Pulang Awal Ringkas (Jika Belum Jam Pulang) */}
          {today?.checkInTime && !today?.checkOutTime && !today?.canCheckoutNow && today?.earliestCheckoutTime && (
            <View style={[styles.earlyWarningCompact, { backgroundColor: 'rgba(217, 119, 6, 0.07)', borderColor: 'rgba(217, 119, 6, 0.22)' }]}>
              <Ionicons name="time-outline" size={15} color={tokens.colors.warning} style={{ marginRight: 7, marginTop: 1 }} />
              <Text style={[styles.earlyWarningText, { color: tokens.colors.warning }]}>
                Shift berakhir <Text style={styles.bold}>{fmtTime(today.shiftEndTime)}</Text> (Check-out normal <Text style={styles.bold}>{fmtTime(today.earliestCheckoutTime)}</Text>). Check-out sekarang memerlukan alasan izin.
              </Text>
            </View>
          )}

          {/* Notice jika shift sudah berakhir dan belum check-in */}
          {!today?.checkInTime && dashboard.data?.today.shift?.isEnded && (
            <View style={[styles.earlyWarningCompact, { backgroundColor: 'rgba(217, 119, 6, 0.08)', borderColor: 'rgba(217, 119, 6, 0.25)' }]}>
              <Ionicons name="information-circle-outline" size={16} color={tokens.colors.warning} style={{ marginRight: 7, marginTop: 1 }} />
              <Text style={[styles.earlyWarningText, { color: tokens.colors.warning }]}>
                Shift {dashboard.data.today.shift.name} telah berakhir pukul <Text style={styles.bold}>{fmtTime(dashboard.data.today.shift.endTime)} WIB</Text>. Presensi masuk hari ini telah ditutup.
              </Text>
            </View>
          )}

          {/* Error Banner jika ada */}
          {actionError && (
            <ErrorBanner
              description={actionError}
              onDismiss={() => setActionError(null)}
              style={{ marginTop: 8 }}
            />
          )}

          {/* Tombol Aksi Utama */}
          <View style={styles.actionRow}>
            {!today?.checkInTime && (
              <Button
                variant={dashboard.data?.today.shift?.isEnded ? 'secondary' : 'gradient'}
                onPress={() => initiateCheck('in')}
                loading={actionLoading === 'in'}
                fullWidth
                size="large"
                icon={dashboard.data?.today.shift?.isEnded ? 'lock-closed-outline' : 'camera-outline'}
              >
                {actionLoading === 'in'
                  ? 'Memeriksa Lokasi...'
                  : dashboard.data?.today.shift?.isEnded
                  ? 'Presensi Masuk Ditutup'
                  : 'Check-in Sekarang'}
              </Button>
            )}

            {today?.checkInTime && !today?.checkOutTime && (
              <Button
                variant={today.canCheckoutNow ? 'primary' : 'outline'}
                onPress={handlePressCheckOut}
                loading={actionLoading === 'out'}
                fullWidth
                size="large"
                icon="log-out-outline"
              >
                {actionLoading === 'out'
                  ? 'Memeriksa Lokasi...'
                  : today.canCheckoutNow
                  ? 'Check-out Sekarang'
                  : 'Izin Pulang Awal'}
              </Button>
            )}

            {today?.checkInTime && today?.checkOutTime && (
              <View style={[styles.completedRow, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                <Ionicons name="checkmark-circle" size={17} color={tokens.colors.success} style={{ marginRight: 6 }} />
                <Text style={[styles.completedText, { color: tokens.colors.success }]}>
                  Presensi hari ini telah selesai
                </Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Riwayat Kehadiran (Clean Minimal List) */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>
          Riwayat Kehadiran
        </Text>
      </View>

      {history.isLoading ? (
        <Text style={[styles.emptyText, { color: tokens.colors.textSecondary }]}>
          Memuat data riwayat...
        </Text>
      ) : rows.length === 0 ? (
        <Card style={styles.card} elevation="sm">
          <CardContent>
            <Text style={[styles.emptyText, { color: tokens.colors.textSecondary, textAlign: 'center', marginVertical: 12 }]}>
              Belum ada riwayat kehadiran.
            </Text>
          </CardContent>
        </Card>
      ) : (
        rows.map((r) => (
          <Card key={r.id} style={styles.historyCard} elevation="sm">
            <CardContent>
              {/* Header Baris Riwayat: Tanggal & Badge Status */}
              <View style={styles.historyHeaderRow}>
                <Text style={[styles.historyDate, { color: tokens.colors.textPrimary }]}>
                  {fmtDate(r.attendanceDate)}
                </Text>
                <Badge variant="subtle" color={getBadgeColor(r.status)}>
                  {statusLabel(r.status)}
                </Badge>
              </View>

              {/* Data Jam Masuk, Keluar, dan Durasi */}
              <View style={styles.historyMetricsRow}>
                <View style={styles.historyMetricCol}>
                  <Text style={[styles.historyLabel, { color: tokens.colors.textSecondary }]}>Masuk</Text>
                  <Text style={[styles.historyValue, { color: tokens.colors.textPrimary }]}>
                    {fmtTime(r.checkInTime)}
                  </Text>
                </View>

                <View style={styles.historyMetricCol}>
                  <Text style={[styles.historyLabel, { color: tokens.colors.textSecondary }]}>Keluar</Text>
                  <Text style={[styles.historyValue, { color: tokens.colors.textPrimary }]}>
                    {fmtTime(r.checkOutTime)}
                  </Text>
                </View>

                <View style={styles.historyMetricCol}>
                  <Text style={[styles.historyLabel, { color: tokens.colors.textSecondary }]}>Keterlambatan</Text>
                  <Text style={[styles.historyValue, { color: r.lateMinutes && r.lateMinutes > 0 ? tokens.colors.error : tokens.colors.textPrimary }]}>
                    {r.lateMinutes && r.lateMinutes > 0 ? `${r.lateMinutes}m` : '—'}
                  </Text>
                </View>

                <View style={styles.historyMetricCol}>
                  <Text style={[styles.historyLabel, { color: tokens.colors.textSecondary }]}>Durasi</Text>
                  <Text style={[styles.historyValue, { color: tokens.colors.textPrimary }]}>
                    {fmtHours(r.workHours)} jam
                  </Text>
                </View>
              </View>

              {/* Opsi Foto Masuk, Foto Keluar & Lokasi Peta */}
              {(r.checkInPhotoUrl || r.checkOutPhotoUrl || (r.checkInLat && r.checkInLng)) && (
                <View style={[styles.historyFooterRow, { borderTopColor: tokens.colors.border }]}>
                  <View style={styles.historyPhotoButtons}>
                    {r.checkInPhotoUrl && (
                      <Pressable
                        style={[styles.historyPillBtn, { backgroundColor: tokens.colors.neutral100 }]}
                        onPress={() =>
                          setViewPhoto({
                            url: r.checkInPhotoUrl!,
                            title: `Foto Masuk · ${fmtDate(r.attendanceDate)}`,
                          })
                        }
                      >
                        <Ionicons name="camera-outline" size={13} color={tokens.colors.success} style={{ marginRight: 4 }} />
                        <Text style={[styles.historyPillBtnText, { color: tokens.colors.textPrimary }]}>Foto Masuk</Text>
                      </Pressable>
                    )}

                    {r.checkOutPhotoUrl && (
                      <Pressable
                        style={[styles.historyPillBtn, { backgroundColor: tokens.colors.neutral100 }]}
                        onPress={() =>
                          setViewPhoto({
                            url: r.checkOutPhotoUrl!,
                            title: `Foto Keluar · ${fmtDate(r.attendanceDate)}`,
                          })
                        }
                      >
                        <Ionicons name="camera-outline" size={13} color={tokens.colors.info} style={{ marginRight: 4 }} />
                        <Text style={[styles.historyPillBtnText, { color: tokens.colors.textPrimary }]}>Foto Keluar</Text>
                      </Pressable>
                    )}
                  </View>

                  {r.checkInLat && r.checkInLng && (
                    <Pressable
                      style={styles.historyMapBtn}
                      onPress={() => {
                        const url = `https://www.google.com/maps?q=${r.checkInLat},${r.checkInLng}`;
                        Linking.openURL(url).catch(() =>
                          Alert.alert('Gagal', 'Tidak dapat membuka aplikasi peta.')
                        );
                      }}
                    >
                      <Ionicons name="map-outline" size={13} color={tokens.colors.textSecondary} style={{ marginRight: 3 }} />
                      <Text style={[styles.historyMapText, { color: tokens.colors.textSecondary }]}>Peta</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal Pulang Lebih Awal */}
      <EarlyLeaveModal
        visible={earlyLeaveModalVisible}
        onClose={() => setEarlyLeaveModalVisible(false)}
        onConfirm={handleConfirmEarlyLeave}
        shiftEndTime={fmtTime(today?.shiftEndTime)}
        earliestCheckoutTime={fmtTime(today?.earliestCheckoutTime)}
      />

      {/* Modal Kamera Wajah */}
      <FaceCameraModal
        visible={faceModalVisible}
        onClose={() => setFaceModalVisible(false)}
        onCapture={handleFaceCaptured}
        actionKind={pendingActionKind}
      />

      {/* Modal Preview Foto Resolusi Penuh */}
      <PhotoModal
        visible={!!viewPhoto}
        onClose={() => setViewPhoto(null)}
        title={viewPhoto?.title || 'Foto Presensi'}
        photoUrl={viewPhoto?.url || null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 36 },
  screenHeader: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  card: {
    marginVertical: 4,
    borderRadius: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  shiftMetaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shiftMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeHeroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  timeHeroColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeHeroDivider: {
    width: 1,
    height: 48,
  },
  timeHeroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  timeHeroValue: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  timeHeroStatusRow: {
    marginTop: 4,
  },
  timeHeroSubtext: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationMinimalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 10,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  proximityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proximityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  proximityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  earlyWarningCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  earlyWarningText: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
  bold: {
    fontWeight: '700',
  },
  actionRow: {
    marginTop: 2,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  historyCard: {
    marginVertical: 4,
    borderRadius: 12,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  historyMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyMetricCol: {
    flex: 1,
  },
  historyLabel: {
    fontSize: 10.5,
    marginBottom: 2,
  },
  historyValue: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  historyFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  historyPhotoButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyPillBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  historyMapText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
    paddingHorizontal: 4,
  },
});
