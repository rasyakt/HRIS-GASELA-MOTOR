import * as Location from 'expo-location';
import { OFFICE_LOCATION } from '../lib/format';

export interface Position {
  latitude: number;
  longitude: number;
  fallback: boolean;
}

export async function getPosition(): Promise<Position> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { latitude: OFFICE_LOCATION.lat, longitude: OFFICE_LOCATION.lng, fallback: true };
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      fallback: false,
    };
  } catch {
    return { latitude: OFFICE_LOCATION.lat, longitude: OFFICE_LOCATION.lng, fallback: true };
  }
}
