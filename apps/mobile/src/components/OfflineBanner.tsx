import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnlineStore } from '../store/online-store';

export function OfflineBanner() {
  const isOnline = useOnlineStore((s) => s.isOnline);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline ? -150 : 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          paddingTop: Math.max(insets.top, 12),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.text}>⚠️ Anda sedang offline. Koneksi internet terputus.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#b45309',
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
