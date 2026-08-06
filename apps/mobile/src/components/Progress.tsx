import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { AnimationDurations, timingConfig } from '../animations';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressProps {
  type?: 'linear' | 'circular';
  progress: number; // 0 to 100
  size?: number; // For circular
  strokeWidth?: number; // For circular
  color?: string; // If not provided, uses gradient or primary
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Progress({
  type = 'linear',
  progress,
  size = 64,
  strokeWidth = 8,
  color,
  showLabel = true,
  style,
}: ProgressProps) {
  const { tokens } = useTheme();
  
  // Clamp progress between 0 and 100
  const validProgress = Math.min(Math.max(progress, 0), 100);
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(validProgress, timingConfig(AnimationDurations.slow));
  }, [validProgress, progressValue]);

  if (type === 'circular') {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const animatedCircleProps = useAnimatedStyle(() => {
      const strokeDashoffset = circumference - (progressValue.value / 100) * circumference;
      return {
        strokeDashoffset,
      } as any;
    });

    return (
      <View style={[styles.circularContainer, { width: size, height: size }, style]}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={color || tokens.gradients.primary[0]} />
              <Stop offset="1" stopColor={color || tokens.gradients.primary[1]} />
            </SvgLinearGradient>
          </Defs>
          {/* Background Circle */}
          <Circle
            stroke={tokens.colors.neutral200}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <AnimatedCircle
            stroke={color || "url(#grad)"}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            animatedProps={animatedCircleProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        {showLabel && (
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.circularLabelContainer}>
              <Text style={[styles.circularLabel, { color: tokens.colors.textPrimary }]}>
                {Math.round(validProgress)}%
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Linear Progress
  const animatedLinearStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value}%`,
    };
  });

  return (
    <View style={[styles.linearWrapper, style]}>
      {showLabel && (
        <View style={styles.linearLabelContainer}>
          <Text style={[styles.linearLabel, { color: tokens.colors.textPrimary }]}>
            {Math.round(validProgress)}%
          </Text>
        </View>
      )}
      <View style={[styles.linearTrack, { backgroundColor: tokens.colors.neutral200, borderRadius: strokeWidth / 2, height: strokeWidth }]}>
        <Animated.View style={[styles.linearFill, animatedLinearStyle]}>
          <LinearGradient
            colors={(color ? [color, color] : tokens.gradients.primary) as [string, string, ...string[]]}
            style={[StyleSheet.absoluteFill, { borderRadius: strokeWidth / 2 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({ title, value, subtitle, icon, style }: StatCardProps) {
  const { tokens } = useTheme();
  const translateX = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(1, timingConfig(AnimationDurations.slow));
  }, [opacity, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          backgroundColor: tokens.colors.surface,
          borderRadius: tokens.borderRadius.lg,
          ...tokens.shadows.md,
        },
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.statHeader}>
        <Text style={[styles.statTitle, { color: tokens.colors.textSecondary, fontSize: tokens.typography.fontSize.sm }]}>
          {title}
        </Text>
        {icon && <View style={styles.statIcon}>{icon}</View>}
      </View>
      <Text style={[styles.statValue, { color: tokens.colors.textPrimary }]}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: tokens.colors.textTertiary, fontSize: tokens.typography.fontSize.xs }]}>
          {subtitle}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Circular
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularLabelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
  
  // Linear
  linearWrapper: {
    width: '100%',
    marginVertical: 8,
  },
  linearLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  linearLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  linearTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  linearFill: {
    height: '100%',
  },

  // StatCard
  statCard: {
    padding: 16,
    marginVertical: 8,
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontWeight: '500',
  },
  statIcon: {
    marginLeft: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtitle: {
    fontWeight: '400',
  },
});
