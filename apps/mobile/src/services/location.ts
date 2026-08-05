import * as Location from 'expo-location';

export interface Position {
  latitude: number;
  longitude: number;
}

export async function getPosition(): Promise<Position> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Izin lokasi ditolak. Aktifkan izin lokasi untuk melakukan absensi.');
  }

  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  } catch {
    throw new Error('Gagal mendeteksi lokasi perangkat. Pastikan GPS/Layanan Lokasi Anda aktif.');
  }
}
