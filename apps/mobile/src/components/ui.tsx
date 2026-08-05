import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { statusColor, statusLabel } from '../lib/format';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

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
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a1a1aa"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
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

  let dateObj = new Date();
  if (mode === 'date' && value) {
    const [y, m, d] = value.split('-');
    if (y && m && d) dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  } else if (mode === 'time' && value) {
    const [h, m] = value.split(':');
    if (h && m) {
      dateObj = new Date();
      dateObj.setHours(Number(h), Number(m));
    }
  }

  const handleValueChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios'); // Keep picker open on iOS (inline), close on Android
    if (selectedDate) {
      if (mode === 'date') {
        const d = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000);
        onChange(d.toISOString().split('T')[0]);
      } else {
        const hh = selectedDate.getHours().toString().padStart(2, '0');
        const mm = selectedDate.getMinutes().toString().padStart(2, '0');
        onChange(`${hh}:${mm}`);
      }
    }
  };

  const handleDismiss = () => {
    setShow(Platform.OS === 'ios');
  };

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable onPress={() => setShow(true)} style={styles.input}>
        <Text style={{ color: value ? '#18181b' : '#a1a1aa', paddingTop: Platform.OS === 'ios' ? 0 : 3 }}>
          {value || (mode === 'date' ? 'Pilih Tanggal' : 'Pilih Waktu')}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={dateObj}
          mode={mode}
          display="default"
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
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
});
