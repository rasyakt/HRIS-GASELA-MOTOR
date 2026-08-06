import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { api } from '../../services/api-client';
import { useTheme } from '../../theme/ThemeProvider';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
}

export function ChangePasswordModal({ visible, onClose, accessToken }: ChangePasswordModalProps) {
  const { tokens } = useTheme();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validasi
    if (!oldPassword.trim()) {
      Alert.alert('Error', 'Password lama harus diisi');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Error', 'Password baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak cocok');
      return;
    }

    if (oldPassword === newPassword) {
      Alert.alert('Error', 'Password baru harus berbeda dari password lama');
      return;
    }

    setLoading(true);
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({
          oldPassword: oldPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      
      Alert.alert('Berhasil', 'Password berhasil diubah', [
        {
          text: 'OK',
          onPress: () => {
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={[styles.modalContainer, { backgroundColor: tokens.colors.surface }]}>
          <View style={styles.handle} />
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
                Ubah Password
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={28} color={tokens.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {/* Old Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
                  Password Lama
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: tokens.colors.neutral100, borderColor: tokens.colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: tokens.colors.textPrimary }]}
                    placeholder="Masukkan password lama"
                    placeholderTextColor={tokens.colors.textTertiary}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry={!showOldPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                    <Ionicons
                      name={showOldPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={tokens.colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
                  Password Baru
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: tokens.colors.neutral100, borderColor: tokens.colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: tokens.colors.textPrimary }]}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor={tokens.colors.textTertiary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={tokens.colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>
                  Konfirmasi Password Baru
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: tokens.colors.neutral100, borderColor: tokens.colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: tokens.colors.textPrimary }]}
                    placeholder="Ulangi password baru"
                    placeholderTextColor={tokens.colors.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={tokens.colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actions}>
                <Button
                  variant="primary"
                  onPress={handleSubmit}
                  loading={loading}
                  fullWidth
                  size="large"
                >
                  Ubah Password
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  actions: {
    marginTop: 8,
  },
});
