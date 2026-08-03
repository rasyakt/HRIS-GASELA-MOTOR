import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { PayrollDetailDto, PayrollDto, Paginated } from '@gasela/shared-types';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, CardTitle, ErrorBanner, Row } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import { useAuthApi } from '../../services/auth-api';
import { useAuthStore } from '../../store/auth-store';
import { apiUrl } from '../../services/api-client';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function fmtRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

function PeriodBadge({ month, year }: { month: number; year: number }) {
  return (
    <View style={styles.periodBadge}>
      <Text style={styles.periodBadgeText}>
        {MONTHS_ID[month - 1]} {year}
      </Text>
    </View>
  );
}

function StatusChip({ status }: { status: PayrollDto['status'] }) {
  const map: Record<PayrollDto['status'], { label: string; color: string }> = {
    draft: { label: 'Draft', color: '#d97706' },
    pending_approval: { label: 'Menunggu', color: '#d97706' },
    approved: { label: 'Disetujui', color: '#0284c7' },
    paid: { label: 'Dibayar', color: '#059669' },
  };
  const { label, color } = map[status] ?? { label: status, color: '#71717a' };
  return (
    <View style={[styles.chip, { backgroundColor: `${color}1A` }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

export function PayslipScreen() {
  const authApi = useAuthApi();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const list = useQuery({
    queryKey: ['payroll-my'],
    queryFn: () => authApi<Paginated<PayrollDto>>('/api/payroll/my?page=1&limit=24'),
  });

  const detail = useQuery({
    queryKey: ['payroll-my-detail', selectedId],
    queryFn: () => authApi<PayrollDetailDto>(`/api/payroll/my/${selectedId}`),
    enabled: selectedId !== null,
  });

  useFocusEffect(
    useCallback(() => {
      list.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  async function handleDownloadPdf(payrollId: number) {
    setDownloadingId(payrollId);
    try {
      const url = `${apiUrl}/api/payroll/my/${payrollId}/payslip`;
      // Buka di browser bawaan — user dapat menyimpan / share dari sana
      await Linking.openURL(
        accessToken ? `${url}?token=${encodeURIComponent(accessToken)}` : url,
      );
    } catch {
      // silent — Linking.openURL sudah tampilkan error bawaan OS
    } finally {
      setDownloadingId(null);
    }
  }

  const items = list.data?.items ?? [];

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={list.isLoading}
            onRefresh={() => list.refetch()}
            tintColor="#18181b"
          />
        }
      >
        <Text style={styles.header}>Slip Gaji</Text>
        <Text style={styles.subheader}>Riwayat gaji Anda per bulan.</Text>

        {list.isError && (
          <ErrorBanner message="Gagal memuat slip gaji. Tarik untuk muat ulang." />
        )}

        {items.length === 0 && !list.isLoading && !list.isError && (
          <Card>
            <Text style={styles.emptyText}>Belum ada data slip gaji.</Text>
          </Card>
        )}

        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setSelectedId(item.id)}
            style={({ pressed }) => [
              styles.slipCard,
              pressed && styles.slipCardPressed,
            ]}
          >
            <View style={styles.slipTop}>
              <PeriodBadge month={item.month} year={item.year} />
              <StatusChip status={item.status} />
            </View>
            <Text style={styles.netSalary}>{fmtRupiah(item.netSalary)}</Text>
            <Text style={styles.slipNumber}>{item.payrollNumber}</Text>
            <View style={styles.slipMeta}>
              <Text style={styles.slipMetaText}>
                Gaji pokok: {fmtRupiah(item.basicSalary)}
              </Text>
              {item.paymentDate && (
                <Text style={styles.slipMetaText}>
                  Dibayar: {fmtDate(item.paymentDate)}
                </Text>
              )}
            </View>
            <View style={styles.slipArrow}>
              <Text style={styles.slipArrowText}>Lihat detail →</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={selectedId !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Slip Gaji</Text>
              <Pressable onPress={() => setSelectedId(null)} hitSlop={10}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            {detail.isLoading && (
              <ActivityIndicator size="large" color="#18181b" style={styles.loader} />
            )}
            {detail.isError && (
              <ErrorBanner message="Gagal memuat detail slip gaji." />
            )}

            {detail.data && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailPeriod}>
                  <PeriodBadge month={detail.data.month} year={detail.data.year} />
                  <StatusChip status={detail.data.status} />
                </View>

                <Text style={styles.detailNet}>{fmtRupiah(detail.data.netSalary)}</Text>
                <Text style={styles.detailNetLabel}>Gaji Bersih (Take Home Pay)</Text>

                <View style={styles.separator} />

                <Text style={styles.sectionLabel}>📥 Pendapatan</Text>
                <Row label="Gaji Pokok" value={fmtRupiah(detail.data.basicSalary)} />
                {detail.data.components
                  .filter((c) => c.type === 'allowance')
                  .map((c) => (
                    <Row key={c.salaryComponentId} label={c.salaryComponentName} value={fmtRupiah(c.amount)} />
                  ))}
                {detail.data.overtimePay > 0 && (
                  <Row label="Upah Lembur" value={fmtRupiah(detail.data.overtimePay)} />
                )}
                <Row label="Total Bruto" value={fmtRupiah(detail.data.grossSalary)} big />

                <View style={styles.separator} />

                <Text style={styles.sectionLabel}>📤 Potongan</Text>
                {detail.data.components
                  .filter((c) => c.type === 'deduction')
                  .map((c) => (
                    <Row key={c.salaryComponentId} label={c.salaryComponentName} value={`- ${fmtRupiah(c.amount)}`} />
                  ))}
                <Row
                  label="BPJS Kesehatan"
                  value={`- ${fmtRupiah(detail.data.bpjsKesehatanEmployee)}`}
                />
                <Row
                  label="BPJS Ketenagakerjaan"
                  value={`- ${fmtRupiah(detail.data.bpjsKetenagakerjaanEmployee)}`}
                />
                {detail.data.taxPph21 > 0 && (
                  <Row label="PPh21" value={`- ${fmtRupiah(detail.data.taxPph21)}`} />
                )}

                <View style={styles.separator} />

                <Text style={styles.sectionLabel}>🏢 Kontribusi Perusahaan</Text>
                <Row
                  label="BPJS Kesehatan"
                  value={fmtRupiah(detail.data.bpjsKesehatanCompany)}
                />
                <Row
                  label="BPJS Ketenagakerjaan"
                  value={fmtRupiah(detail.data.bpjsKetenagakerjaanCompany)}
                />

                {detail.data.approvedByName && (
                  <>
                    <View style={styles.separator} />
                    <Row label="Disetujui oleh" value={detail.data.approvedByName} />
                    {detail.data.approvedAt && (
                      <Row label="Tanggal persetujuan" value={fmtDate(detail.data.approvedAt)} />
                    )}
                  </>
                )}

                <View style={styles.downloadBtn}>
                  <Button
                    title={
                      downloadingId === selectedId
                        ? 'Membuka PDF…'
                        : '⬇ Unduh PDF'
                    }
                    onPress={() => selectedId && handleDownloadPdf(selectedId)}
                    loading={downloadingId === selectedId}
                    disabled={detail.data.status === 'draft'}
                  />
                  {detail.data.status === 'draft' && (
                    <Text style={styles.draftNote}>
                      PDF tersedia setelah slip gaji disetujui.
                    </Text>
                  )}
                </View>

                <View style={styles.closeRow}>
                  <Button
                    title="Tutup"
                    variant="outline"
                    onPress={() => setSelectedId(null)}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafafa' },
  container: { padding: 16, paddingBottom: 32 },
  header: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  subheader: { fontSize: 13, color: '#71717a', marginTop: 2, marginBottom: 16 },
  emptyText: { color: '#71717a', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  loader: { marginVertical: 32 },

  // Slip card
  slipCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 16,
    marginBottom: 12,
  },
  slipCardPressed: { opacity: 0.85, backgroundColor: '#f4f4f5' },
  slipTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  netSalary: { fontSize: 24, fontWeight: '800', color: '#18181b', marginBottom: 2 },
  slipNumber: { fontSize: 12, color: '#a1a1aa', marginBottom: 8 },
  slipMeta: { gap: 2 },
  slipMetaText: { fontSize: 13, color: '#71717a' },
  slipArrow: { marginTop: 10, alignItems: 'flex-end' },
  slipArrowText: { fontSize: 13, color: '#18181b', fontWeight: '600' },

  // Period badge
  periodBadge: {
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  periodBadgeText: { fontSize: 13, fontWeight: '600', color: '#3f3f46' },

  // Status chip
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: '600' },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#18181b' },
  closeBtn: { fontSize: 18, color: '#71717a', paddingHorizontal: 4 },
  detailPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  detailNet: { fontSize: 32, fontWeight: '800', color: '#18181b', marginBottom: 2 },
  detailNetLabel: { fontSize: 13, color: '#71717a', marginBottom: 4 },
  separator: {
    height: 1,
    backgroundColor: '#f4f4f5',
    marginVertical: 12,
  },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#71717a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  downloadBtn: { marginTop: 20 },
  draftNote: { fontSize: 12, color: '#a1a1aa', marginTop: 6, textAlign: 'center' },
  closeRow: { marginTop: 10, marginBottom: 8 },
});
