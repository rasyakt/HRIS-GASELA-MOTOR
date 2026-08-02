import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, CardTitle, Row } from '../../components/ui';
import { ROLE_LABEL } from '../../lib/format';
import { api } from '../../services/api-client';
import { useAuthStore } from '../../store/auth-store';

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearSession = useAuthStore((s) => s.clearSession);

  function confirmLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar dari aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          try {
            if (accessToken) {
              await api('/api/auth/logout', { method: 'POST', token: accessToken });
            }
          } catch {
            // tetap lanjut keluar meski server error
          } finally {
            clearSession();
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.header}>Profil</Text>
      <Card style={styles.card}>
        <CardTitle>{user?.fullName ?? '—'}</CardTitle>
        <Row label="Username" value={user?.username ?? '—'} />
        <Row label="Role" value={user ? (ROLE_LABEL[user.role] ?? user.role) : '—'} />
        <Row label="Departemen" value={user?.department ?? '—'} />
      </Card>

      <Card style={styles.card}>
        <CardTitle>Tentang</CardTitle>
        <Row label="Aplikasi" value="Gasela HRIS" />
        <Row label="Versi" value="0.1.0" />
        <Text style={styles.note}>
          Gasela HRIS — sistem kehadiran, cuti & lembur karyawan.
        </Text>
      </Card>

      <Button title="Keluar" variant="destructive" onPress={confirmLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafafa' },
  container: { padding: 16, paddingBottom: 32 },
  header: { fontSize: 20, fontWeight: '700', color: '#18181b', marginBottom: 16 },
  card: { marginBottom: 12 },
  note: { fontSize: 12, color: '#a1a1aa', marginTop: 8 },
});
