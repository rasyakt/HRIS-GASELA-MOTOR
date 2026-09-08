import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ForceChangePasswordScreen } from '../screens/auth/ForceChangePasswordScreen';
import { TabNavigator, type TabParamList } from './TabNavigator';
import { LeaveListScreen } from '../screens/leave/LeaveListScreen';
import { AttendanceScreen } from '../screens/attendance/AttendanceScreen';
import { OvertimeScreen } from '../screens/overtime/OvertimeScreen';
import { PayslipScreen } from '../screens/payroll/PayslipScreen';
import { useAuthStore } from '../store/auth-store';
import { useTheme } from '../theme/ThemeProvider';

export type RootStackParamList = {
  Login: undefined;
  ForceChangePassword: undefined;
  Main: undefined;
  Attendance: undefined;
  Leave: undefined;
  Overtime: undefined;
  Payslip: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator({ loggedIn }: { loggedIn: boolean }) {
  const { tokens } = useTheme();
  const user = useAuthStore((s) => s.user);
  const mustChangePassword = loggedIn && Boolean(user?.mustChangePassword);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: tokens.colors.surface },
        headerTintColor: tokens.colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      {loggedIn ? (
        mustChangePassword ? (
          <Stack.Screen
            name="ForceChangePassword"
            component={ForceChangePasswordScreen}
            options={{ gestureEnabled: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ headerShown: true, title: 'Riwayat Kehadiran' }} />
            <Stack.Screen name="Leave" component={LeaveListScreen} options={{ headerShown: true, title: 'Cuti' }} />
            <Stack.Screen name="Overtime" component={OvertimeScreen} options={{ headerShown: true, title: 'Lembur' }} />
            <Stack.Screen name="Payslip" component={PayslipScreen} options={{ headerShown: true, title: 'Slip Gaji' }} />
          </>
        )
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export type { TabParamList };
