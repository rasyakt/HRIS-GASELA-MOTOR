import { View, Text, StyleSheet } from 'react-native';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Status hari ini, sisa cuti, pengumuman (Fase 1).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { marginTop: 8, fontSize: 14, color: '#71717a', textAlign: 'center' },
});