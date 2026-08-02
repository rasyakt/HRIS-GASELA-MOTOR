import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { LeaveListScreen } from '../screens/leave/LeaveListScreen';
import { AttendanceScreen } from '../screens/attendance/AttendanceScreen';
import { OvertimeScreen } from '../screens/overtime/OvertimeScreen';

export type TabParamList = {
  Home: undefined;
  Attendance: undefined;
  Leave: undefined;
  Overtime: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#18181b',
        tabBarInactiveTintColor: '#a1a1aa',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Beranda' }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ title: 'Kehadiran' }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveListScreen}
        options={{ title: 'Cuti' }}
      />
      <Tab.Screen
        name="Overtime"
        component={OvertimeScreen}
        options={{ title: 'Lembur' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}
