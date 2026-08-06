import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DashboardSummary } from '@gasela/shared-types';
import { useCallback, useState, useEffect } from 'react';
import {
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
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card, CardHeader, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { StatCard } from '../../components/Progress';
import { Skeleton, FullScreenLoader } from '../../components/Loading';
import { ErrorState, ErrorBanner } from '../../components/ErrorState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtTime, ROLE_LABEL } from '../../lib/format';
import { useAuthApi } from '../../services/auth-api';
import { getPosition } from '../../services/location';
import { useAuthStore } from '../../store/auth-store';
import { useTheme } from '../../theme/ThemeProvider';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { AnimationDurations, timingConfig, scalePress } from '../../animations';
import { triggerHapticFeedback } from '../../animations/gestures';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function QuickAction({ icon, label, onPress, color, delay }: { icon: any; label: string; onPress: () => void; color: string; delay: number }) {
  const { tokens } = useTheme();
  const isPressed = useSharedValue(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, timingConfig(AnimationDurations.normal)));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }));
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
      style={[styles.quickAction, { backgroundColor: tokens.colors.surface, ...tokens.shadows.sm }]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: tokens.colors.textPrimary }]}>{label}</Text>
    </AnimatedPressable>
  );
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
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 16) + 8 }]}
        refreshControl={
          <RefreshControl refreshing={isLoading && !data} onRefresh={refetch} tintColor={tokens.colors.primary} />
        }
      >
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: tokens.colors.textPrimary }]}>
              Halo, {user?.fullName?.split(' ')[0] ?? 'Karyawan'}
            </Text>
            <Text style={[styles.date, { color: tokens.colors.textSecondary }]}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {user ? ` · ${ROLE_LABEL[user.role]}` : ''}
            </Text>
          </View>
          <Avatar name={user?.fullName || '?'} size="md" border />
        </Animated.View>
        {isError && !data ? (
          <ErrorState description="Gagal memuat data dashboard." onRetry={refetch} />
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>Kehadiran Hari Ini</Text>
            {isLoading && !data ? (
              <Skeleton height={200} borderRadius={16} style={{ marginBottom: 24 }} />
            ) : (
              <Card variant="elevated" elevation="md" style={styles.heroCard}>
                <CardHeader 
                  title={today?.shiftName || 'Jadwal Reguler'} 
                  icon="time-outline"
                  action={
                    today ? (
                      <Badge 
                        variant="subtle" 
                        color={today.status === 'present' ? 'success' : today.status === 'late' ? 'warning' : 'neutral'}
                      >
                        {today.status ? today.status.toUpperCase() : 'BELUM ABSEN'}
                      </Badge>
                    ) : (
                      <Badge variant="subtle" color="neutral">BELUM ABSEN</Badge>
                    )
                  }
                />
                <CardContent>
                  <View style={[styles.heroTimes, { backgroundColor: tokens.colors.neutral100 }]}>
                    <View style={styles.heroTimeBlock}>
                      <Text style={[styles.heroTimeLabel, { color: tokens.colors.textSecondary }]}>Check-in</Text>
                      <Text style={[styles.heroTimeValue, { color: tokens.colors.textPrimary }]}>
                        {today?.checkInTime ? fmtTime(today.checkInTime) : '--:--'}
                      </Text>
                    </View>
                    <View style={[styles.heroTimeDivider, { backgroundColor: tokens.colors.border }]} />
                    <View style={styles.heroTimeBlock}>
                      <Text style={[styles.heroTimeLabel, { color: tokens.colors.textSecondary }]}>Check-out</Text>
                      <Text style={[styles.heroTimeValue, { color: tokens.colors.textPrimary }]}>
                        {today?.checkOutTime ? fmtTime(today.checkOutTime) : '--:--'}
                      </Text>
                    </View>
                  </View>
                  
                  {actionError && (
                    <ErrorBanner description={actionError} onDismiss={() => setActionError(null)} style={{ marginTop: 12, marginBottom: 12 }} />
                  )}

                  <View style={styles.heroActionRow}>
                    {!today?.checkInTime && (
                      <Button variant="gradient" onPress={() => handleCheck('in')} loading={actionLoading === 'in'} fullWidth size="large">
                        Check-in Sekarang
                      </Button>
                    )}
                    {today?.checkInTime && !today.checkOutTime && (
                      <Button variant="primary" onPress={() => handleCheck('out')} loading={actionLoading === 'out'} fullWidth size="large">
                        Check-out
                      </Button>
                    )}
                  </View>
                </CardContent>
              </Card>
            )}

            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>Menu Utama</Text>
            <View style={styles.grid}>
              <QuickAction icon="time-outline" label="Riwayat" onPress={() => navigation.navigate('Attendance')} color={tokens.colors.info} delay={100} />
              <QuickAction icon="calendar-outline" label="Cuti" onPress={() => navigation.navigate('Leave')} color={tokens.colors.success} delay={150} />
              <QuickAction icon="alarm-outline" label="Lembur" onPress={() => navigation.navigate('Overtime')} color={tokens.colors.warning} delay={200} />
              <QuickAction icon="wallet-outline" label="Slip Gaji" onPress={() => navigation.navigate('Payslip')} color={tokens.colors.secondary} delay={250} />
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
                  icon={<Ionicons name="hourglass-outline" size={20} color={tokens.colors.warning} />}
                  style={{ marginRight: 8 }}
                />
                <StatCard
                  title="Lembur Pending"
                  value={data?.pendingOvertime ?? 0}
                  icon={<Ionicons name="hourglass-outline" size={20} color={tokens.colors.warning} />}
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
  },
  headerText: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: '700' },
  date: { fontSize: 13, marginTop: 4 },
  container: { padding: 20, paddingBottom: 100 },
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
  heroActionRow: { marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  quickAction: { 
    width: '48%', 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    marginBottom: 16, 
  },
  quickActionIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12,
  },
  quickActionLabel: { fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  marginCard: { marginBottom: 24 },
  leaveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  leaveName: { fontSize: 15, fontWeight: '500' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 12 },
});
