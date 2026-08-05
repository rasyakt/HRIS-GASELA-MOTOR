import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import type { UnreadCountDto } from '@gasela/shared-types';
import { Text, View, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { LeaveListScreen } from '../screens/leave/LeaveListScreen';
import { AttendanceScreen } from '../screens/attendance/AttendanceScreen';
import { OvertimeScreen } from '../screens/overtime/OvertimeScreen';
import { PayslipScreen } from '../screens/payroll/PayslipScreen';
import { AnnouncementScreen } from '../screens/announcements/AnnouncementScreen';
import { useAuthApi } from '../services/auth-api';

export type TabParamList = {
  Home: undefined;
  Attendance: undefined;
  Leave: undefined;
  Overtime: undefined;
  Payslip: undefined;
  Announcements: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={tabStyles.icon}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
    </View>
  );
}

function AnnouncementTabIcon({
  focused,
  color,
}: {
  focused: boolean;
  color: string;
}) {
  const authApi = useAuthApi();
  const { data } = useQuery({
    queryKey: ['announcements-unread'],
    queryFn: () => authApi<UnreadCountDto>('/api/announcements/unread-count'),
    refetchInterval: 60_000, // poll tiap 1 menit
  });
  const count = data?.unread ?? 0;

  return (
    <View style={tabStyles.icon}>
      <Text style={tabStyles.emoji}>📢</Text>
      {count > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  icon: { alignItems: 'center', justifyContent: 'center', width: 28, height: 28 },
  emoji: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#dc2626',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#18181b',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e4e4e7',
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="🏠" label="Beranda" />,
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          title: 'Kehadiran',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="📍" label="Kehadiran" />,
        }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveListScreen}
        options={{
          title: 'Cuti',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="🏖" label="Cuti" />,
        }}
      />
      <Tab.Screen
        name="Overtime"
        component={OvertimeScreen}
        options={{
          title: 'Lembur',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="⏰" label="Lembur" />,
        }}
      />
      <Tab.Screen
        name="Payslip"
        component={PayslipScreen}
        options={{
          title: 'Slip Gaji',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="💰" label="Slip Gaji" />,
        }}
      />
      <Tab.Screen
        name="Announcements"
        component={AnnouncementScreen}
        options={{
          title: 'Pengumuman',
          tabBarIcon: AnnouncementTabIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="👤" label="Profil" />,
        }}
      />
    </Tab.Navigator>
  );
}
