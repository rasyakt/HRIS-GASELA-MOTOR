import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { ROLE_LABEL } from '../../lib/format';
import { api } from '../../services/api-client';
import { useAuthStore } from '../../store/auth-store';
import { useTheme } from '../../theme/ThemeProvider';
import { AnimationDurations, timingConfig } from '../../animations';
import { Ionicons } from '@expo/vector-icons';

export function ProfileScreen() {
  const { tokens, theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Animations
  const headerOpacity = useSharedValue(0);
  const listOpacity1 = useSharedValue(0);
  const listOpacity2 = useSharedValue(0);
  const listOpacity3 = useSharedValue(0);
  const listOpacity4 = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, timingConfig(AnimationDurations.slow));
    listOpacity1.value = withDelay(100, withTiming(1, timingConfig(AnimationDurations.normal)));
    listOpacity2.value = withDelay(200, withTiming(1, timingConfig(AnimationDurations.normal)));
    listOpacity3.value = withDelay(300, withTiming(1, timingConfig(AnimationDurations.normal)));
    listOpacity4.value = withDelay(400, withTiming(1, timingConfig(AnimationDurations.normal)));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const listStyle1 = useAnimatedStyle(() => ({ opacity: listOpacity1.value }));
  const listStyle2 = useAnimatedStyle(() => ({ opacity: listOpacity2.value }));
  const listStyle3 = useAnimatedStyle(() => ({ opacity: listOpacity3.value }));
  const listStyle4 = useAnimatedStyle(() => ({ opacity: listOpacity4.value }));

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

  return (
    <View style={[styles.flex, { backgroundColor: tokens.colors.background }]}>
      <Animated.View style={[styles.headerGradient, headerStyle]}>
        <LinearGradient
          colors={tokens.gradients.primary as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
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
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.container}
        style={styles.flex}
      >
        <Animated.View style={[styles.cardWrapper, listStyle1]}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Informasi Karyawan</Text>
          <Card variant="default">
            <CardContent noPadding>
              <ListItem
                icon="person-outline"
                title="Username"
                trailing={<Text style={{ color: tokens.colors.textSecondary }}>{user?.username ?? '—'}</Text>}
              />
              <ListItem
                icon="business-outline"
                title="Departemen"
                trailing={<Text style={{ color: tokens.colors.textSecondary }}>{user?.department ?? '—'}</Text>}
                hasDivider={false}
              />
            </CardContent>
          </Card>
        </Animated.View>

        <Animated.View style={[styles.cardWrapper, listStyle2]}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Pengaturan</Text>
          <Card variant="default">
            <CardContent noPadding>
              <ListItem
                icon={theme === 'dark' ? 'moon' : 'sunny'}
                title="Mode Gelap"
                subtitle="Tema antarmuka aplikasi"
                onPress={toggleTheme}
                trailing={
                  <View style={[styles.themeToggle, { backgroundColor: tokens.colors.primaryLight }]}>
                    <Text style={{ color: tokens.colors.primary, fontWeight: '600', fontSize: 12 }}>
                      {theme === 'dark' ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                }
              />
              <ListItem
                icon="lock-closed-outline"
                title="Ubah Password"
                onPress={() => {}} // Placeholder
                hasDivider={false}
                trailing={<Ionicons name="chevron-forward" size={20} color={tokens.colors.textTertiary} />}
              />
            </CardContent>
          </Card>
        </Animated.View>

        <Animated.View style={[styles.cardWrapper, listStyle3]}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>Tentang</Text>
          <Card variant="default">
            <CardContent noPadding>
              <ListItem
                icon="information-circle-outline"
                title="Aplikasi"
                subtitle="Gasela HRIS — sistem kehadiran"
                trailing={<Text style={{ color: tokens.colors.textSecondary }}>v0.1.0</Text>}
                hasDivider={false}
              />
            </CardContent>
          </Card>
        </Animated.View>

        <Animated.View style={[styles.buttonWrapper, listStyle4]}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerGradient: {
    paddingTop: 60, // safe area approx
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
  container: { 
    padding: 20, 
    paddingBottom: 40,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  buttonWrapper: {
    marginTop: 8,
    marginBottom: 60, // For tab bar
  }
});
