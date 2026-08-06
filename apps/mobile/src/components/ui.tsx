export { GaselaLogo } from './logo';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  Platform,
} from 'react-native';
import { statusColor, statusLabel } from '../lib/format';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import { useAuthApi } from '../services/auth-api';
import type { HolidayDto } from '@gasela/shared-types';
import { Ionicons } from '@expo/vector-icons';

LocaleConfig.locales['id'] = {
  monthNames: ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],
  monthNamesShort: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'],
  dayNames: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
  dayNamesShort: ['Min','Sen','Sel','Rab','Kam','Jum','Sab'],
  today: 'Hari ini'
};
LocaleConfig.defaultLocale = 'id';

import { useTheme } from '../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'outline' | 'destructive' | 'ghost';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: object;
}) {
  const { tokens } = useTheme();
  const isDisabled = disabled || loading;

  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: tokens.colors.primary };
      case 'outline':
        return {
          backgroundColor: tokens.colors.surface,
          borderWidth: 1,
          borderColor: tokens.colors.border,
        };
      case 'destructive':
        return { backgroundColor: `${tokens.colors.error}1A` };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      default:
        return { backgroundColor: tokens.colors.primary };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return tokens.colors.surface;
      case 'destructive':
        return tokens.colors.error;
      case 'outline':
        return tokens.colors.textPrimary;
      case 'ghost':
        return tokens.colors.primary;
      default:
        return tokens.colors.surface;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        getButtonStyles(),
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
      ) : (
        <Text style={[styles.buttonText, { color: getTextColor() }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const { tokens } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          borderWidth: 1,
          ...tokens.shadows.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  const { tokens } = useTheme();
  return <Text style={[styles.cardTitle, { color: tokens.colors.textPrimary }]}>{children}</Text>;
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const color = statusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  const { tokens } = useTheme();
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: tokens.colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputContainer, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.textTertiary}
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          style={[
            styles.inputField,
            { color: tokens.colors.textPrimary },
            multiline && styles.inputMultiline
          ]}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setIsSecure(!isSecure)} style={styles.eyeButton}>
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={tokens.colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  mode = 'date',
}: {
  label: string;
  value: string; // YYYY-MM-DD or HH:MM
  onChange: (v: string) => void;
  mode?: 'date' | 'time';
}) {
  const { tokens } = useTheme();
  const [show, setShow] = useState(false);
  const authApi = useAuthApi();

  const { data: holidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => authApi<HolidayDto[]>('/api/settings/holidays'),
    enabled: mode === 'date',
  });

  const markedDates: Record<string, any> = {};
  
  if (mode === 'date') {
    const currentYear = new Date().getFullYear();
    holidays?.forEach(h => {
      const d = new Date(h.date);
      if (h.isRecurringYearly) {
        for(let yr = currentYear - 1; yr <= currentYear + 1; yr++) {
          const dateStr = `${yr}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          markedDates[dateStr] = { marked: true, dotColor: tokens.colors.error };
        }
      } else {
        const dateStr = d.toISOString().split('T')[0];
        markedDates[dateStr] = { marked: true, dotColor: tokens.colors.error };
      }
    });

    if (value) {
      markedDates[value] = { ...markedDates[value], selected: true, selectedColor: tokens.colors.primary };
    }
  }

  let dateObj = new Date();
  if (mode === 'time' && value) {
    const [h, m] = value.split(':');
    if (h && m) {
      dateObj = new Date();
      dateObj.setHours(Number(h), Number(m));
    }
  }

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      const hh = selectedDate.getHours().toString().padStart(2, '0');
      const mm = selectedDate.getMinutes().toString().padStart(2, '0');
      onChange(`${hh}:${mm}`);
    }
  };

  const handleDateSelect = (day: any) => {
    onChange(day.dateString);
    setShow(false);
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: tokens.colors.textSecondary }]}>{label}</Text>
      <Pressable onPress={() => setShow(true)} style={[styles.input, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
        <Text style={{ color: value ? tokens.colors.textPrimary : tokens.colors.textTertiary, paddingTop: Platform.OS === 'ios' ? 0 : 3 }}>
          {value || (mode === 'date' ? 'Pilih Tanggal' : 'Pilih Waktu')}
        </Text>
      </Pressable>
      
      {mode === 'date' && (
        <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.calendarModal, { backgroundColor: tokens.colors.surface }]}>
              <Text style={[styles.modalTitle, { color: tokens.colors.textPrimary }]}>Pilih Tanggal</Text>
              <Calendar
                current={value || undefined}
                onDayPress={handleDateSelect}
                markedDates={markedDates}
                theme={{
                  calendarBackground: tokens.colors.surface,
                  textSectionTitleColor: tokens.colors.textSecondary,
                  selectedDayBackgroundColor: tokens.colors.primary,
                  selectedDayTextColor: tokens.colors.surface,
                  todayTextColor: tokens.colors.error,
                  dayTextColor: tokens.colors.textPrimary,
                  textDisabledColor: tokens.colors.textTertiary,
                  dotColor: tokens.colors.primary,
                  selectedDotColor: tokens.colors.surface,
                  arrowColor: tokens.colors.textPrimary,
                  disabledArrowColor: tokens.colors.textTertiary,
                  monthTextColor: tokens.colors.textPrimary,
                  indicatorColor: tokens.colors.primary,
                }}
              />
              <Button title="Tutup" variant="ghost" onPress={() => setShow(false)} style={{ marginTop: 12 }} />
            </View>
          </View>
        </Modal>
      )}

      {mode === 'time' && show && (
        <DateTimePicker
          value={dateObj}
          mode="time"
          display="default"
          onValueChange={handleTimeChange}
          onDismiss={() => setShow(Platform.OS === 'ios')}
        />
      )}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  const { tokens } = useTheme();
  return <Text style={[styles.empty, { color: tokens.colors.textSecondary }]}>{message}</Text>;
}

export function ErrorBanner({ message }: { message: string }) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.errorBanner, { backgroundColor: `${tokens.colors.error}1A` }]}>
      <Text style={[styles.errorText, { color: tokens.colors.error }]}>{message}</Text>
    </View>
  );
}

export function InfoBanner({ message }: { message: string }) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.infoBanner, { backgroundColor: `${tokens.colors.success}1A` }]}>
      <Text style={[styles.infoText, { color: tokens.colors.success }]}>{message}</Text>
    </View>
  );
}

export function Row({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  const { tokens } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: tokens.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: tokens.colors.textPrimary }, big && styles.rowValueBig]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPrimary: {},
  buttonOutline: {},
  buttonDestructive: {},
  buttonGhost: { backgroundColor: 'transparent' },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  buttonTextPrimary: {},
  buttonTextDestructive: {},
  card: {
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputContainer: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  inputField: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  eyeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  errorBanner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 13 },
  infoBanner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  infoText: { fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  rowValueBig: { fontSize: 18, fontWeight: '700' },
  calendarModal: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    alignSelf: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
});
