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
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'outline' && styles.buttonOutline,
        variant === 'destructive' && styles.buttonDestructive,
        variant === 'ghost' && styles.buttonGhost,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : '#18181b'}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.buttonTextPrimary,
            variant === 'destructive' && styles.buttonTextDestructive,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.cardTitle}>{children}</Text>;
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
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#a1a1aa"
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          style={[styles.inputField, multiline && styles.inputMultiline]}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setIsSecure(!isSecure)} style={styles.eyeButton}>
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#71717a"
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
          markedDates[dateStr] = { marked: true, dotColor: '#dc2626' };
        }
      } else {
        const dateStr = d.toISOString().split('T')[0];
        markedDates[dateStr] = { marked: true, dotColor: '#dc2626' };
      }
    });

    if (value) {
      markedDates[value] = { ...markedDates[value], selected: true, selectedColor: '#18181b' };
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
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable onPress={() => setShow(true)} style={styles.input}>
        <Text style={{ color: value ? '#18181b' : '#a1a1aa', paddingTop: Platform.OS === 'ios' ? 0 : 3 }}>
          {value || (mode === 'date' ? 'Pilih Tanggal' : 'Pilih Waktu')}
        </Text>
      </Pressable>
      
      {mode === 'date' && (
        <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.calendarModal}>
              <Text style={styles.modalTitle}>Pilih Tanggal</Text>
              <Calendar
                current={value || undefined}
                onDayPress={handleDateSelect}
                markedDates={markedDates}
                theme={{
                  selectedDayBackgroundColor: '#18181b',
                  todayTextColor: '#dc2626',
                  arrowColor: '#18181b',
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
  return <Text style={styles.empty}>{message}</Text>;
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function InfoBanner({ message }: { message: string }) {
  return (
    <View style={styles.infoBanner}>
      <Text style={styles.infoText}>{message}</Text>
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
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, big && styles.rowValueBig]}>{value}</Text>
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
  buttonPrimary: { backgroundColor: '#18181b' },
  buttonOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  buttonDestructive: { backgroundColor: '#fee2e2' },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  buttonTextPrimary: { color: '#fff' },
  buttonTextDestructive: { color: '#dc2626' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#18181b', marginBottom: 12 },
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
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#3f3f46', marginBottom: 6 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#18181b',
    backgroundColor: '#fff',
  },
  inputContainer: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingRight: 10,
  },
  inputField: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#18181b',
  },
  eyeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  empty: { color: '#71717a', fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#dc2626', fontSize: 13 },
  infoBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  infoText: { color: '#059669', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 14, color: '#71717a' },
  rowValue: { fontSize: 14, color: '#18181b', fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  rowValueBig: { fontSize: 18, fontWeight: '700' },
  calendarModal: {
    backgroundColor: '#fff',
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
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#18181b', marginBottom: 14 },
});
