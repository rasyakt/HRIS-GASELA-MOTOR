import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { TabNavigator, type TabParamList } from './TabNavigator';
import { LeaveListScreen } from '../screens/leave/LeaveListScreen';
import { AttendanceScreen } from '../screens/attendance/AttendanceScreen';
import { OvertimeScreen } from '../screens/overtime/OvertimeScreen';
import { PayslipScreen } from '../screens/payroll/PayslipScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Attendance: undefined;
  Leave: undefined;
  Overtime: undefined;
  Payslip: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator({ loggedIn }: { loggedIn: boolean }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {loggedIn ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ headerShown: true, title: 'Riwayat Kehadiran' }} />
          <Stack.Screen name="Leave" component={LeaveListScreen} options={{ headerShown: true, title: 'Cuti' }} />
          <Stack.Screen name="Overtime" component={OvertimeScreen} options={{ headerShown: true, title: 'Lembur' }} />
          <Stack.Screen name="Payslip" component={PayslipScreen} options={{ headerShown: true, title: 'Slip Gaji' }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export type { TabParamList };
