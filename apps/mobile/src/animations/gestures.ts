import { Platform, Vibration } from 'react-native';

export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  // Simple polyfill since expo-haptics is not explicitly requested, 
  // though typically we'd use expo-haptics here.
  // We'll use React Native's Vibration for a simple feedback.
  if (Platform.OS === 'ios') {
    // iOS doesn't have great built-in haptics via Vibration, 
    // it just vibrates for 400ms which is too long. 
    // In a full app we'd use expo-haptics.
    // Vibration.vibrate(10); 
  } else {
    switch (type) {
      case 'light':
        // Disabled by default: raw vibration on Android feels too cheap/strong for simple taps.
        // Vibration.vibrate(10);
        break;
      case 'medium':
        Vibration.vibrate(15);
        break;
      case 'heavy':
        Vibration.vibrate(30);
        break;
      default:
        // do nothing
        break;
    }
  }
}
