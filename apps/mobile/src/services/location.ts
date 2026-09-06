import * as Location from 'expo-location';
import { distanceInMeters } from '@gasela/shared-utils';

export interface Position {
  latitude: number;
  longitude: number;
}

export interface GeofenceCheckResult {
  isWithinGeofence: boolean;
  distance: number;
  formattedDistance: string;
  radius: number;
  position: Position;
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

export async function checkGeofence(
  officeLat: number,
  officeLng: number,
  radiusMeters = 500,
): Promise<GeofenceCheckResult> {
  const position = await getPosition();
  const distance = distanceInMeters(
    position.latitude,
    position.longitude,
    officeLat,
    officeLng,
  );
  const roundedDist = Math.round(distance);
  const formattedDistance =
    roundedDist >= 1000
      ? `${(roundedDist / 1000).toFixed(1)} km`
      : `${roundedDist}m`;

  return {
    isWithinGeofence: distance <= radiusMeters,
    distance,
    formattedDistance,
    radius: radiusMeters,
    position,
  };
}
