import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import type { UnreadCountDto } from '@gasela/shared-types';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AnnouncementScreen } from '../screens/announcements/AnnouncementScreen';
import { useAuthApi } from '../services/auth-api';

export type TabParamList = {
  Home: undefined;
  Announcements: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ name, color }: { name: any; color: string }) {
  return (
    <View style={tabStyles.icon}>
      <Ionicons name={name} size={24} color={color} />
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
      <Ionicons name={focused ? "notifications" : "notifications-outline"} size={24} color={color} />
      {count > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  icon: { alignItems: 'center', justifyContent: 'center', width: 32, height: 32, marginTop: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
});

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: '#ffffff',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 4 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
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
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
