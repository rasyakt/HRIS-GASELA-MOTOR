import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateLeaveRequestInput,
  LeaveBalanceDto,
  LeaveRequestDto,
  LeaveTypeDto,
  Paginated,
} from '@gasela/shared-types';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, CardTitle, ErrorBanner, StatusBadge, TextField } from '../../components/ui';
import { fmtDate, fmtDateTime, todayInput } from '../../lib/format';
import { useAuthApi } from '../../services/auth-api';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function LeaveListScreen() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(todayInput());
  const [endDate, setEndDate] = useState(todayInput());
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setLeaveTypeId(null);
    setStartDate(todayInput());
    setEndDate(todayInput());
    setReason('');
    setFormError(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const balances = useQuery({
    queryKey: ['leave-balances'],
    queryFn: () => authApi<LeaveBalanceDto[]>('/api/leaves/balances/my'),
  });

  const types = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => authApi<LeaveTypeDto[]>('/api/leaves/types'),
  });

  const myRequests = useQuery({
    queryKey: ['leave-my'],
    queryFn: () =>
      authApi<Paginated<LeaveRequestDto>>('/api/leaves/requests/my?page=1&limit=20'),
  });

  useFocusEffect(
    useCallback(() => {
      myRequests.refetch();
      balances.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    queryClient.invalidateQueries({ queryKey: ['leave-my'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const create = useMutation({
    mutationFn: (input: CreateLeaveRequestInput) =>
      authApi('/api/leaves/requests', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      invalidate();
      handleCloseModal();
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Gagal mengajukan cuti.'),
  });

  const cancel = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/leaves/requests/${id}/cancel`, { method: 'POST' }),
    onSuccess: invalidate,
    onError: (err) =>
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal membatalkan pengajuan.'),
  });

  function confirmCancel(id: number, requestNumber: string) {
    Alert.alert('Batalkan Pengajuan', `Batalkan ${requestNumber}?`, [
      { text: 'Tidak', style: 'cancel' },
      { text: 'Ya, batalkan', style: 'destructive', onPress: () => cancel.mutate(id) },
    ]);
  }

  function submit() {
    setFormError(null);
    if (!leaveTypeId) {
      setFormError('Pilih jenis cuti terlebih dahulu.');
      return;
    }
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      setFormError('Tanggal harus format YYYY-MM-DD.');
      return;
    }
    if (endDate < startDate) {
      setFormError('Tanggal selesai harus setelah/sama dengan tanggal mulai.');
      return;
    }
    if (reason.trim().length < 5) {
      setFormError('Alasan minimal 5 karakter.');
      return;
    }
    create.mutate({ leaveTypeId, startDate, endDate, reason: reason.trim() });
  }

  const activeTypes = (types.data ?? []).filter((t) => t.isActive);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={myRequests.isLoading}
          onRefresh={() => {
            myRequests.refetch();
            balances.refetch();
          }}
          tintColor="#18181b"
        />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Cuti</Text>
          <Text style={styles.subheader}>Saldo & pengajuan cuti Anda.</Text>
        </View>
        <Button title="Ajukan Cuti" onPress={() => setModalOpen(true)} />
      </View>

      <Card style={styles.card}>
        <CardTitle>Saldo Cuti</CardTitle>
        {balances.data && balances.data.length > 0 ? (
          balances.data.map((b) => (
            <View key={b.leaveTypeId} style={styles.balanceRow}>
              <Text style={styles.balanceName}>{b.leaveTypeName}</Text>
              <Text style={styles.balanceValue}>
                sisa <Text style={styles.balanceStrong}>{b.remaining}</Text>/{b.quota}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Belum ada saldo cuti.</Text>
        )}
      </Card>

      <Card style={styles.card}>
        <CardTitle>Riwayat Pengajuan</CardTitle>
        {myRequests.data && myRequests.data.items.length > 0 ? (
          myRequests.data.items.map((r) => (
            <View key={r.id} style={styles.reqRow}>
              <View style={styles.reqLeft}>
                <Text style={styles.reqNumber}>{r.requestNumber}</Text>
                <Text style={styles.reqMeta}>
                  {r.leaveTypeName} · {fmtDate(r.startDate)} – {fmtDate(r.endDate)} (
                  {r.totalDays} hari)
                </Text>
                <Text style={styles.reqMeta}>Diajukan {fmtDateTime(r.createdAt)}</Text>
              </View>
              <View style={styles.reqRight}>
                <StatusBadge status={r.status} />
                {r.status === 'pending' && (
                  <Pressable
                    onPress={() => confirmCancel(r.id, r.requestNumber)}
                    disabled={cancel.isPending}
                  >
                    <Text style={styles.cancelText}>Batalkan</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Belum ada pengajuan cuti.</Text>
        )}
      </Card>

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Ajukan Cuti</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {formError && <ErrorBanner message={formError} />}
              <Text style={styles.fieldLabel}>Jenis Cuti</Text>
              {activeTypes.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada jenis cuti aktif.</Text>
              ) : (
                <View style={styles.typeList}>
                  {activeTypes.map((t) => {
                    const selected = leaveTypeId === t.id;
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => setLeaveTypeId(t.id)}
                        style={[styles.typeItem, selected && styles.typeItemSelected]}
                      >
                        <Text
                          style={[
                            styles.typeItemText,
                            selected && styles.typeItemTextSelected,
                          ]}
                        >
                          {t.name}
                        </Text>
                        <Text style={styles.typeItemMeta}>
                          {t.isPaid ? 'berbayar' : 'tidak berbayar'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              <TextField
                label="Tanggal Mulai (YYYY-MM-DD)"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="mis. 2026-08-10"
              />
              <TextField
                label="Tanggal Selesai (YYYY-MM-DD)"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="mis. 2026-08-12"
              />
              <TextField
                label="Alasan"
                value={reason}
                onChangeText={setReason}
                placeholder="Tuliskan alasan pengajuan cuti…"
                multiline
              />
              <Button
                title="Kirim Pengajuan"
                onPress={submit}
                loading={create.isPending}
              />
              <View style={styles.modalCancel}>
                <Button title="Batal" variant="outline" onPress={handleCloseModal} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafafa' },
  container: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  header: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  subheader: { fontSize: 13, color: '#71717a', marginTop: 2 },
  card: { marginBottom: 12 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  balanceName: { fontSize: 14, color: '#3f3f46' },
  balanceValue: { fontSize: 14, color: '#71717a' },
  balanceStrong: { fontSize: 16, fontWeight: '700', color: '#18181b' },
  reqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  reqLeft: { flex: 1, marginRight: 12 },
  reqNumber: { fontSize: 14, fontWeight: '600', color: '#18181b' },
  reqMeta: { fontSize: 12, color: '#71717a', marginTop: 2 },
  reqRight: { alignItems: 'flex-end', gap: 6 },
  cancelText: { color: '#dc2626', fontSize: 12, fontWeight: '600', marginTop: 6 },
  emptyText: { color: '#71717a', fontSize: 14, paddingVertical: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#18181b', marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#3f3f46', marginBottom: 6 },
  typeList: { marginBottom: 14 },
  typeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  typeItemSelected: { borderColor: '#18181b', backgroundColor: '#f4f4f5' },
  typeItemText: { fontSize: 14, fontWeight: '600', color: '#18181b' },
  typeItemTextSelected: { color: '#18181b' },
  typeItemMeta: { fontSize: 12, color: '#71717a' },
  modalCancel: { marginTop: 8 },
});
