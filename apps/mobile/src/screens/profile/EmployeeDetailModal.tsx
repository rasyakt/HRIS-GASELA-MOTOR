import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { fmtDate } from '../../lib/format';
import { Card, CardContent } from '../../components/Card';
import { ListItem } from '../../components/ListItem';
import { Badge } from '../../components/Badge';

interface EmployeeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  emp: any;
}

export function EmployeeDetailModal({ visible, onClose, emp }: EmployeeDetailModalProps) {
  const { tokens } = useTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: tokens.colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.header, { borderBottomColor: tokens.colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="id-card-outline" size={22} color={tokens.colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
                Detail Biodata Karyawan
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. Biodata Pribadi */}
            <View style={styles.sectionWrapper}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>
                Biodata Pribadi
              </Text>
              <Card variant="default">
                <CardContent noPadding>
                  <ListItem
                    icon="person-outline"
                    title="Nama Lengkap"
                    trailing={<Text style={{ color: tokens.colors.textPrimary, fontWeight: '600' }}>{emp?.fullName ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="card-outline"
                    title="NIK Karyawan"
                    trailing={<Text style={{ color: tokens.colors.textPrimary, fontWeight: '700' }}>{emp?.employeeNumber ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="document-text-outline"
                    title="Nomor KTP"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.idCardNumber ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="receipt-outline"
                    title="NPWP"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.taxNumber ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="calendar-outline"
                    title="Tanggal Lahir"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{fmtDate(emp?.birthDate)}</Text>}
                  />
                  {emp?.birthPlace && (
                    <ListItem
                      icon="location-outline"
                      title="Tempat Lahir"
                      trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp.birthPlace}</Text>}
                    />
                  )}
                  {emp?.gender && (
                    <ListItem
                      icon="people-outline"
                      title="Jenis Kelamin"
                      trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp.gender}</Text>}
                    />
                  )}
                  {emp?.religion && (
                    <ListItem
                      icon="book-outline"
                      title="Agama"
                      trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp.religion}</Text>}
                    />
                  )}
                  {emp?.maritalStatus && (
                    <ListItem
                      icon="heart-outline"
                      title="Status Pernikahan"
                      trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp.maritalStatus}</Text>}
                    />
                  )}
                  <ListItem
                    icon="map-outline"
                    title="Alamat Domisili"
                    trailing={
                      <Text style={{ color: tokens.colors.textSecondary, maxWidth: '60%', textAlign: 'right' }} numberOfLines={3}>
                        {emp?.address ?? '—'}
                      </Text>
                    }
                    hasDivider={false}
                  />
                </CardContent>
              </Card>
            </View>

            {/* 2. Informasi Kepegawaian */}
            <View style={styles.sectionWrapper}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>
                Informasi Pekerjaan
              </Text>
              <Card variant="default">
                <CardContent noPadding>
                  <ListItem
                    icon="business-outline"
                    title="Departemen"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.department?.name ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="briefcase-outline"
                    title="Posisi / Jabatan"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.position?.name ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="shield-checkmark-outline"
                    title="Status Kerja"
                    trailing={
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Badge variant="subtle" color="info">
                          {emp?.employmentStatus ?? 'Aktif'}
                        </Badge>
                        {emp?.employmentType && (
                          <Badge variant="subtle" color="neutral">
                            {emp.employmentType}
                          </Badge>
                        )}
                      </View>
                    }
                  />
                  <ListItem
                    icon="today-outline"
                    title="Tanggal Bergabung"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{fmtDate(emp?.joinDate)}</Text>}
                  />
                  <ListItem
                    icon="mail-outline"
                    title="Email"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.email ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="call-outline"
                    title="Nomor Telepon"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.phone ?? '—'}</Text>}
                    hasDivider={false}
                  />
                </CardContent>
              </Card>
            </View>

            {/* 3. Informasi Rekening Bank */}
            <View style={styles.sectionWrapper}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textSecondary }]}>
                Rekening Payroll
              </Text>
              <Card variant="default">
                <CardContent noPadding>
                  <ListItem
                    icon="wallet-outline"
                    title="Nama Bank"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.bankName ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="person-circle-outline"
                    title="Nama Pemilik Rekening"
                    trailing={<Text style={{ color: tokens.colors.textSecondary }}>{emp?.bankAccountName ?? '—'}</Text>}
                  />
                  <ListItem
                    icon="card-outline"
                    title="Nomor Rekening"
                    trailing={
                      <Text style={{ color: tokens.colors.textPrimary, fontWeight: '700', letterSpacing: 0.5 }}>
                        {emp?.bankAccountNumber ?? '—'}
                      </Text>
                    }
                    hasDivider={false}
                  />
                </CardContent>
              </Card>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionWrapper: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
});
