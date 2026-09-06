import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';

export interface EarlyLeaveModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  shiftEndTime?: string | null;
  earliestCheckoutTime?: string | null;
}

export function EarlyLeaveModal({
  visible,
  onClose,
  onConfirm,
  shiftEndTime,
  earliestCheckoutTime,
}: EarlyLeaveModalProps) {
  const { tokens } = useTheme();
  const [reason, setReason] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setReason('');
      setErrorText(null);
    }
  }, [visible]);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setErrorText('Alasan izin wajib diisi minimal 3 karakter.');
      return;
    }
    setErrorText(null);
    onConfirm(trimmed);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: tokens.colors.surface }]}>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(217, 119, 6, 0.15)' }]}>
                  <Ionicons name="alert-circle" size={22} color={tokens.colors.warning} />
                </View>
                <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
                  Pulang Awal (Early Leave)
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={tokens.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Information Body */}
            <View style={[styles.infoBox, { backgroundColor: 'rgba(217, 119, 6, 0.08)', borderColor: 'rgba(217, 119, 6, 0.25)' }]}>
              <Text style={[styles.infoText, { color: tokens.colors.textPrimary }]}>
                Jam kerja shift Anda belum selesai (jam kepulangan{' '}
                <Text style={styles.bold}>{shiftEndTime || '17:00'}</Text>, batas check-out normal{' '}
                <Text style={styles.bold}>{earliestCheckoutTime || '—'}</Text>).
              </Text>
              <Text style={[styles.infoSubtext, { color: tokens.colors.textSecondary }]}>
                Untuk melakukan check-out lebih awal, Anda <Text style={styles.bold}>wajib menyertakan alasan izin</Text>. Presensi akan otomatis tercatat sebagai <Text style={styles.bold}>Pulang Cepat</Text>.
              </Text>
            </View>

            {/* Input Reason */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tokens.colors.textPrimary }]}>
                Alasan Pulang Lebih Awal <Text style={{ color: tokens.colors.error }}>*</Text>
              </Text>
              <TextInput
                value={reason}
                onChangeText={(t) => {
                  setReason(t);
                  if (errorText) setErrorText(null);
                }}
                placeholder="Contoh: Izin pulang lebih awal karena demam / ada urusan keluarga mendesak"
                placeholderTextColor={tokens.colors.neutral400}
                multiline
                numberOfLines={3}
                style={[
                  styles.textarea,
                  {
                    color: tokens.colors.textPrimary,
                    borderColor: errorText ? tokens.colors.error : tokens.colors.border,
                    backgroundColor: tokens.colors.neutral50 ?? '#fafafa',
                  },
                ]}
              />
              {errorText && (
                <Text style={[styles.errorMsg, { color: tokens.colors.error }]}>
                  {errorText}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                variant="outline"
                onPress={onClose}
                style={styles.cancelBtn}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                onPress={handleConfirm}
                disabled={reason.trim().length < 3}
                style={styles.confirmBtn}
              >
                Lanjut Check-out
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  infoSubtext: {
    fontSize: 12,
    lineHeight: 17,
  },
  bold: {
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorMsg: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1.5,
  },
});
