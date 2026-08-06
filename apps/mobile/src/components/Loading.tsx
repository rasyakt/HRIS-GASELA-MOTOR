import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, StyleProp, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

export interface SpinnerProps {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Spinner({ size = 'large', color, style }: SpinnerProps) {
  const { tokens } = useTheme();
  return (
    <ActivityIndicator
      size={size}
      color={color || tokens.colors.primary}
      style={style}
    />
  );
}

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const { width: screenWidth } = Dimensions.get('window');

export function Skeleton({ width = '100%', height = 20, borderRadius, style }: SkeletonProps) {
  const { tokens } = useTheme();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, [shimmerValue]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-screenWidth, screenWidth]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        styles.skeletonContainer,
        {
          width: width as any,
          height: height as any,
          borderRadius: borderRadius ?? tokens.borderRadius.base,
          backgroundColor: tokens.colors.neutral200,
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export interface FullScreenLoaderProps {
  visible: boolean;
  text?: string;
  progress?: number; // 0 to 100
}

export function FullScreenLoader({ visible, text, progress }: FullScreenLoaderProps) {
  const { tokens } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.fullScreenContainer}>
      <View style={[styles.loaderBox, { backgroundColor: tokens.colors.surface, ...tokens.shadows.xl }]}>
        <Spinner size="large" />
        {text && (
          <Text style={[styles.loaderText, { color: tokens.colors.textPrimary, marginTop: progress !== undefined ? 8 : 16 }]}>
            {text}
          </Text>
        )}
        {progress !== undefined && (
          <Text style={[styles.progressText, { color: tokens.colors.textSecondary }]}>
            {Math.round(progress)}%
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    overflow: 'hidden',
  },
  fullScreenContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 999,
  },
  loaderBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  loaderText: {
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});
