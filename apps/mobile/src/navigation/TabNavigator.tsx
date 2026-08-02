import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { LeaveListScreen } from '../screens/leave/LeaveListScreen';
import { AnnouncementScreen } from '../screens/announcements/AnnouncementScreen';

export type TabParamList = {
  Home: undefined;
  Leave: undefined;
  Announcements: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Leave" component={LeaveListScreen} />
      <Tab.Screen name="Announcements" component={AnnouncementScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}