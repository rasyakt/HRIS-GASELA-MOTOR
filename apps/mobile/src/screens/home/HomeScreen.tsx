import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DashboardSummary } from '@gasela/shared-types';
import { useCallback, useState, useEffect } from 'react';
import {
  Alert,
  RefreshControl,
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
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FaceCameraModal } from '../../components/FaceCameraModal';
import { EarlyLeaveModal } from '../../components/EarlyLeaveModal';
import { Button } from '../../components/Button';
import { Card, CardHeader, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { StatCard } from '../../components/Progress';
import { Skeleton, FullScreenLoader } from '../../components/Loading';
import { ErrorState, ErrorBanner } from '../../components/ErrorState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtTime, ROLE_LABEL, statusLabel } from '../../lib/format';
import { useAuthApi } from '../../services/auth-api';
import { getPosition, checkGeofence, type Position } from '../../services/location';
import { useAuthStore } from '../../store/auth-store';
import { useTheme } from '../../theme/ThemeProvider';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { AnimationDurations, timingConfig, scalePress } from '../../animations';
import { triggerHapticFeedback } from '../../animations/gestures';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function QuickAction({
  icon,
  label,
  subtitle,
  onPress,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
  delay: number;
}) {
  const { tokens } = useTheme();
  const isPressed = useSharedValue(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, timingConfig(AnimationDurations.normal)));
    translateY.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 120 }));
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scalePress(isPressed.value) }
      ],
    };
  });

  const handlePressIn = () => { isPressed.value = true; };
  const handlePressOut = () => { isPressed.value = false; };
  const handlePress = () => {
    triggerHapticFeedback('light');
    onPress();
  };

  return (
    <AnimatedPressable
      style={[
        styles.quickAction,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          ...tokens.shadows.sm,
        },
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View style={styles.quickActionTopRow}>
        <View style={[styles.quickActionIconFrame, { backgroundColor: tokens.colors.neutral100, borderColor: tokens.colors.border }]}>
          <Ionicons name={icon} size={18} color={tokens.colors.textPrimary} />
        </View>
        <Ionicons name="chevron-forward" size={13} color={tokens.colors.textTertiary} />
      </View>
      <View style={styles.quickActionTextGroup}>
        <Text style={[styles.quickActionLabel, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.quickActionSubtitle, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

function isCheckInTooRecent(checkInTimeStr: string, maxMinutes = 2): boolean {
  try {
    const parts = checkInTimeStr.split(':').map(Number);
    if (parts.length >= 2) {
      const checkInMinutes = parts[0] * 60 + parts[1];
      const now = new Date();
      const wibHours = (now.getUTCHours() + 7) % 24;
      const nowMinutes = wibHours * 60 + now.getUTCMinutes();
      const diff = nowMinutes - checkInMinutes;
      return diff >= 0 && diff < maxMinutes;
    }
  } catch {
    return false;
  }
  return false;
}

export function HomeScreen() {
  const { tokens } = useTheme();
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
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
  const [earlyLeaveModalVisible, setEarlyLeaveModalVisible] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');

  // Animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, timingConfig(AnimationDurations.slow));
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, [headerOpacity, headerTranslateY]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => authApi<DashboardSummary>('/api/dashboard/summary'),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  async function initiateCheck(kind: 'in' | 'out') {
    setActionError(null);

    // Opsi 1: Kunci Check-in Setelah Jam Shift Berakhir
    if (kind === 'in') {
      const shiftInfo = data?.today.shift;
      if (shiftInfo?.isEnded) {
        setActionError(
          `Shift ${shiftInfo.name} telah berakhir pada pukul ${fmtTime(shiftInfo.endTime)} WIB. Anda tidak dapat melakukan check-in setelah jam shift selesai.`
        );
        return;
      }
    }

    setActionLoading(kind);
    try {
      const office = data?.officeLocation;
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

  function handlePressCheckOut() {
    const todayAtt = data?.today.attendance;

    // 1. Cek aturan jam shift & pencegahan check-out instan (Sesuai Aturan Website HRIS)
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

  const today = data?.today.attendance ?? null;

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  return (
    <View style={[styles.flex, { backgroundColor: tokens.colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isLoading && !data} onRefresh={refetch} tintColor={tokens.colors.primary} />
        }
      >
        {/* Header with Gradient Background */}
        <Animated.View style={animatedHeaderStyle}>
          <LinearGradient
            colors={tokens.gradients.primary as unknown as readonly [string, string, ...string[]]}
            style={[styles.headerBackground, { paddingTop: Math.max(insets.top, 16) + 16 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={[styles.greeting, { color: '#ffffff' }]}>
                  Halo, {user?.fullName?.split(' ')[0] ?? 'Karyawan'}
                </Text>
                <View style={styles.headerSubtitleRow}>
                  <Text style={[styles.date, { color: 'rgba(255,255,255,0.85)' }]}>
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                  {user && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{ROLE_LABEL[user.role]}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Avatar name={user?.fullName || '?'} size="md" border />
            </View>
          </LinearGradient>
        </Animated.View>
        {isError && !data ? (
          <ErrorState description="Gagal memuat data dashboard." onRetry={refetch} />
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>Kehadiran Hari Ini</Text>
            {isLoading && !data ? (
              <Skeleton height={200} borderRadius={16} style={{ marginBottom: 24 }} />
            ) : (
              <Card variant="elevated" elevation="lg" style={styles.heroCard}>
                <CardHeader 
                  title={today?.shiftName || 'Jadwal Reguler'} 
                  icon="time-outline"
                  action={
                    today ? (
                      <Badge 
                        variant="subtle" 
                        color={today.status === 'present' ? 'success' : today.status === 'late' ? 'warning' : 'neutral'}
                      >
                        {today.status ? statusLabel(today.status).toUpperCase() : 'BELUM ABSEN'}
                      </Badge>
                    ) : (
                      <Badge variant="subtle" color="neutral">BELUM ABSEN</Badge>
                    )
                  }
                />
                <CardContent>
                  <View style={[styles.heroTimes, { backgroundColor: tokens.colors.neutral100, borderWidth: 1, borderColor: tokens.colors.border }]}>
                    <View style={styles.heroTimeBlock}>
                      <Text style={[styles.heroTimeLabel, { color: tokens.colors.textSecondary }]}>Check-in</Text>
                      <Text style={[styles.heroTimeValue, { color: today?.checkInTime ? tokens.colors.primary : tokens.colors.textSecondary }]}>
                        {today?.checkInTime ? fmtTime(today.checkInTime) : '--:--'}
                      </Text>
                    </View>
                    <View style={[styles.heroTimeDivider, { backgroundColor: tokens.colors.border }]} />
                    <View style={styles.heroTimeBlock}>
                      <Text style={[styles.heroTimeLabel, { color: tokens.colors.textSecondary }]}>Check-out</Text>
                      <Text style={[styles.heroTimeValue, { color: today?.checkOutTime ? tokens.colors.primary : tokens.colors.textSecondary }]}>
                        {today?.checkOutTime ? fmtTime(today.checkOutTime) : '--:--'}
                      </Text>
                    </View>
                  </View>
                  
                  {data?.officeLocation && (
                    <View
                      style={[
                        styles.locationBox,
                        {
                          backgroundColor: userDistance
                            ? userDistance.isWithin
                              ? 'rgba(16, 185, 129, 0.06)'
                              : 'rgba(239, 68, 68, 0.06)'
                            : tokens.colors.surface,
                          borderColor: userDistance
                            ? userDistance.isWithin
                              ? 'rgba(16, 185, 129, 0.3)'
                              : 'rgba(239, 68, 68, 0.3)'
                            : tokens.colors.border,
                        },
                      ]}
                    >
                      <View style={styles.locationHeaderRow}>
                        <View style={styles.locationTitleGroup}>
                          <View
                            style={[
                              styles.locationIconWrap,
                              {
                                backgroundColor: userDistance
                                  ? userDistance.isWithin
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(239, 68, 68, 0.15)'
                                  : tokens.colors.neutral100,
                              },
                            ]}
                          >
                            <Ionicons
                              name="location-sharp"
                              size={16}
                              color={
                                userDistance
                                  ? userDistance.isWithin
                                    ? tokens.colors.success
                                    : tokens.colors.error
                                  : tokens.colors.primary
                              }
                            />
                          </View>
                          <View style={styles.locationTextColumn}>
                            <Text
                              style={[styles.locationName, { color: tokens.colors.textPrimary }]}
                              numberOfLines={1}
                            >
                              {data.officeLocation.companyName || 'Kantor'}
                            </Text>
                            <Text style={[styles.locationSubtitle, { color: tokens.colors.textSecondary }]}>
                              Radius kantor: {data.officeLocation.radiusMeters} meter
                            </Text>
                          </View>
                        </View>

                        {userDistance ? (
                          <View
                            style={[
                              styles.proximityPill,
                              {
                                backgroundColor: userDistance.isWithin
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : 'rgba(239, 68, 68, 0.15)',
                                borderColor: userDistance.isWithin
                                  ? 'rgba(16, 185, 129, 0.35)'
                                  : 'rgba(239, 68, 68, 0.35)',
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.proximityDot,
                                {
                                  backgroundColor: userDistance.isWithin
                                    ? tokens.colors.success
                                    : tokens.colors.error,
                                },
                              ]}
                            />
                            <Text
                              style={[
                                styles.proximityText,
                                {
                                  color: userDistance.isWithin
                                    ? tokens.colors.success
                                    : tokens.colors.error,
                                },
                              ]}
                            >
                              {userDistance.isWithin
                                ? userDistance.formatted
                                : `Luar (${userDistance.formatted})`}
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.proximityPillNeutral, { backgroundColor: tokens.colors.neutral200 }]}>
                            <Text style={[styles.proximityNeutralText, { color: tokens.colors.textSecondary }]}>
                              Geofence
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {actionError && (
                    <ErrorBanner description={actionError} onDismiss={() => setActionError(null)} style={{ marginTop: 4, marginBottom: 12 }} />
                  )}

                  {today?.checkInTime && !today.checkOutTime && !today.canCheckoutNow && today.earliestCheckoutTime && (
                    <View style={[styles.earlyWarningBox, { backgroundColor: 'rgba(217, 119, 6, 0.08)', borderColor: 'rgba(217, 119, 6, 0.22)' }]}>
                      <Ionicons name="time-outline" size={15} color={tokens.colors.warning} style={{ marginRight: 8, marginTop: 1 }} />
                      <Text style={[styles.earlyWarningText, { color: tokens.colors.warning }]}>
                        Shift berakhir <Text style={{ fontWeight: '700' }}>{fmtTime(today.shiftEndTime)}</Text> (Check-out normal <Text style={{ fontWeight: '700' }}>{fmtTime(today.earliestCheckoutTime)}</Text>). Check-out sekarang memerlukan alasan izin.
                      </Text>
                    </View>
                  )}

                  {!today?.checkInTime && data?.today.shift?.isEnded && (
                    <View style={[styles.earlyWarningBox, { backgroundColor: 'rgba(217, 119, 6, 0.08)', borderColor: 'rgba(217, 119, 6, 0.25)' }]}>
                      <Ionicons name="information-circle-outline" size={16} color={tokens.colors.warning} style={{ marginRight: 8, marginTop: 1 }} />
                      <Text style={[styles.earlyWarningText, { color: tokens.colors.warning }]}>
                        Shift {data.today.shift.name} telah berakhir pukul <Text style={{ fontWeight: '700' }}>{fmtTime(data.today.shift.endTime)} WIB</Text>. Presensi masuk hari ini telah ditutup.
                      </Text>
                    </View>
                  )}

                  <View style={styles.heroActionRow}>
                    {!today?.checkInTime && (
                      <Button
                        variant={data?.today.shift?.isEnded ? "secondary" : "gradient"}
                        onPress={() => initiateCheck('in')}
                        loading={actionLoading === 'in'}
                        fullWidth
                        size="large"
                        icon={data?.today.shift?.isEnded ? "lock-closed-outline" : "log-in-outline"}
                      >
                        {actionLoading === 'in'
                          ? 'Memeriksa Lokasi...'
                          : data?.today.shift?.isEnded
                          ? 'Presensi Masuk Ditutup'
                          : 'Check-in Sekarang'}
                      </Button>
                    )}
                    {today?.checkInTime && !today.checkOutTime && (
                      <Button
                        variant={today.canCheckoutNow ? "primary" : "outline"}
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
                  </View>
                </CardContent>
              </Card>
            )}

            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>Menu Utama</Text>
            <View style={styles.grid}>
              <QuickAction
                icon="calendar-outline"
                label="Riwayat"
                subtitle="Rekap presensi"
                onPress={() => navigation.navigate('Attendance')}
                delay={80}
              />
              <QuickAction
                icon="document-text-outline"
                label="Cuti"
                subtitle="Pengajuan & kuota"
                onPress={() => navigation.navigate('Leave')}
                delay={120}
              />
              <QuickAction
                icon="timer-outline"
                label="Lembur"
                subtitle="Klaim jam kerja"
                onPress={() => navigation.navigate('Overtime')}
                delay={160}
              />
              <QuickAction
                icon="receipt-outline"
                label="Slip Gaji"
                subtitle="Rincian bulanan"
                onPress={() => navigation.navigate('Payslip')}
                delay={200}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>Informasi Anda</Text>
            {isLoading && !data ? (
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Skeleton width="48%" height={100} borderRadius={16} />
                <Skeleton width="48%" height={100} borderRadius={16} />
              </View>
            ) : (
              <View style={styles.statsRow}>
                <StatCard
                  title="Cuti Pending"
                  value={data?.pendingLeave ?? 0}
                  icon={<Ionicons name="document-text-outline" size={18} color={tokens.colors.textSecondary} />}
                  style={{ marginRight: 8 }}
                />
                <StatCard
                  title="Lembur Pending"
                  value={data?.pendingOvertime ?? 0}
                  icon={<Ionicons name="timer-outline" size={18} color={tokens.colors.textSecondary} />}
                  style={{ marginLeft: 8 }}
                />
              </View>
            )}

            <Card style={styles.marginCard}>
              <CardHeader title="Saldo Cuti" />
              <CardContent>
                {data && data.leaveBalances.length > 0 ? (
                  data.leaveBalances.map((b) => (
                    <View key={b.leaveTypeId} style={[styles.leaveRow, { borderBottomColor: tokens.colors.border }]}>
                      <Text style={[styles.leaveName, { color: tokens.colors.textPrimary }]}>{b.leaveTypeName}</Text>
                      <Badge variant="subtle" color="info">{`sisa ${b.remaining}/${b.quota}`}</Badge>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: tokens.colors.textSecondary }]}>Belum ada saldo cuti.</Text>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Early Leave Modal (Sesuai Aturan Website HRIS) */}
      <EarlyLeaveModal
        visible={earlyLeaveModalVisible}
        onClose={() => setEarlyLeaveModalVisible(false)}
        onConfirm={handleConfirmEarlyLeave}
        shiftEndTime={today?.shiftEndTime}
        earliestCheckoutTime={today?.earliestCheckoutTime}
      />

      {/* Face Camera Modal for Live Attendance Verification */}
      <FaceCameraModal
        visible={faceModalVisible}
        onClose={() => setFaceModalVisible(false)}
        onCapture={handleFaceCaptured}
        actionKind={pendingActionKind}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 110 },
  headerBackground: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginHorizontal: -20,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  headerText: { flex: 1, paddingRight: 12 },
  greeting: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },
  headerSubtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 6 },
  date: { fontSize: 13, fontWeight: '500', opacity: 0.9, letterSpacing: 0.1 },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  roleBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, marginTop: 8 },
  heroCard: { marginBottom: 28 },
  heroTimes: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 20,
    marginTop: 8,
  },
  heroTimeBlock: { flex: 1, alignItems: 'center' },
  heroTimeLabel: { fontSize: 12, marginBottom: 4 },
  heroTimeValue: { fontSize: 20, fontWeight: 'bold' },
  heroTimeDivider: { width: 1, marginHorizontal: 16 },
  locationBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  locationIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationTextColumn: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  locationSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  proximityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  proximityPillNeutral: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  proximityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  proximityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  proximityNeutralText: {
    fontSize: 11,
    fontWeight: '600',
  },
  earlyWarningBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  earlyWarningText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  heroActionRow: { marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  quickAction: { 
    width: '48%', 
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  quickActionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickActionIconFrame: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTextGroup: {
    alignItems: 'flex-start',
  },
  quickActionLabel: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  quickActionSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  marginCard: { marginBottom: 24 },
  leaveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  leaveName: { fontSize: 15, fontWeight: '500' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 12 },
});
