import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateOvertimeInput,
  OvertimeRequestDto,
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
import { fmtDate, fmtDateTime, fmtHours, fmtTime, todayInput } from '../../lib/format';
import { useAuthApi } from '../../services/auth-api';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function OvertimeScreen() {
  const authApi = useAuthApi();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [overtimeDate, setOvertimeDate] = useState(todayInput());
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('20:00');
  const [purpose, setPurpose] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const myRequests = useQuery({
    queryKey: ['overtime-my'],
    queryFn: () =>
      authApi<Paginated<OvertimeRequestDto>>('/api/overtime/requests/my?page=1&limit=20'),
  });

  useFocusEffect(
    useCallback(() => {
      myRequests.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['overtime-my'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const create = useMutation({
    mutationFn: (input: CreateOvertimeInput) =>
      authApi('/api/overtime/requests', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setPurpose('');
      setOvertimeDate(todayInput());
      setStartTime('17:00');
      setEndTime('20:00');
      setFormError(null);
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : 'Gagal mengajukan lembur.'),
  });

  const cancel = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/overtime/requests/${id}/cancel`, { method: 'POST' }),
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
    if (!DATE_RE.test(overtimeDate)) {
      setFormError('Tanggal harus format YYYY-MM-DD.');
      return;
    }
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      setFormError('Jam harus format HH:MM (24 jam).');
      return;
    }
    if (endTime <= startTime) {
      setFormError('Jam selesai harus setelah jam mulai.');
      return;
    }
    if (purpose.trim().length < 5) {
      setFormError('Tujuan minimal 5 karakter.');
      return;
    }
    create.mutate({ overtimeDate, startTime, endTime, purpose: purpose.trim() });
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={myRequests.isLoading}
          onRefresh={() => myRequests.refetch()}
          tintColor="#18181b"
        />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Lembur</Text>
          <Text style={styles.subheader}>Pengajuan lembur Anda.</Text>
        </View>
        <Button title="Ajukan Lembur" onPress={() => setModalOpen(true)} />
      </View>

      <Card style={styles.card}>
        <CardTitle>Riwayat Pengajuan</CardTitle>
        {myRequests.data && myRequests.data.items.length > 0 ? (
          myRequests.data.items.map((r) => (
            <View key={r.id} style={styles.reqRow}>
              <View style={styles.reqLeft}>
                <Text style={styles.reqNumber}>{r.requestNumber}</Text>
                <Text style={styles.reqMeta}>
                  {fmtDate(r.overtimeDate)} · {fmtTime(r.startTime)} – {fmtTime(r.endTime)} (
                  {fmtHours(r.hours)} jam)
                </Text>
                {r.purpose ? <Text style={styles.reqMeta}>“{r.purpose}”</Text> : null}
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
          <Text style={styles.emptyText}>Belum ada pengajuan lembur.</Text>
        )}
      </Card>

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Ajukan Lembur</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {formError && <ErrorBanner message={formError} />}
              <TextField
                label="Tanggal Lembur (YYYY-MM-DD)"
                value={overtimeDate}
                onChangeText={setOvertimeDate}
                placeholder="mis. 2026-08-05"
              />
              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <TextField
                    label="Mulai (HH:MM)"
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="17:00"
                  />
                </View>
                <View style={styles.timeCol}>
                  <TextField
                    label="Selesai (HH:MM)"
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="20:00"
                  />
                </View>
              </View>
              <TextField
                label="Tujuan"
                value={purpose}
                onChangeText={setPurpose}
                placeholder="Jelaskan tujuan lembur…"
                multiline
              />
              <Button
                title="Kirim Pengajuan"
                onPress={submit}
                loading={create.isPending}
              />
              <View style={styles.modalCancel}>
                <Button title="Batal" variant="outline" onPress={() => setModalOpen(false)} />
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
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#18181b', marginBottom: 14 },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeCol: { flex: 1 },
  modalCancel: { marginTop: 8 },
});
