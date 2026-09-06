import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { timingConfig, AnimationDurations } from '../animations';

export interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  fullScreen?: boolean;
}

export function ErrorState({
  title = 'An error occurred',
  description,
  onRetry,
  style,
  fullScreen = false,
}: ErrorStateProps) {
  const { tokens } = useTheme();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, timingConfig(AnimationDurations.normal));
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, fullScreen && styles.fullScreen, animatedStyle, style]}>
      <View style={[styles.iconContainer, { backgroundColor: tokens.colors.errorLight }]}>
        <Ionicons name="alert-circle" size={48} color={tokens.colors.error} />
      </View>
      <Text style={[styles.title, { color: tokens.colors.textPrimary, fontSize: tokens.typography.fontSize.lg }]}>
        {title}
      </Text>
      <Text style={[styles.description, { color: tokens.colors.textSecondary, fontSize: tokens.typography.fontSize.base }]}>
        {description}
      </Text>
      {onRetry && (
        <Button
          variant="outline"
          onPress={onRetry}
          icon="refresh"
          style={styles.retryButton}
        >
          Retry
        </Button>
      )}
    </Animated.View>
  );
}

export interface ErrorBannerProps {
  title?: string;
  description: string;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  autoDismiss?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ErrorBanner({
  title,
  description,
  type,
  onDismiss,
  autoDismiss = true,
  style,
}: ErrorBannerProps) {
  const { tokens } = useTheme();
  const [visible, setVisible] = useState(true);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  // Auto-detect business/informational rules vs system crashes
  const isBusinessNotice =
    type === 'warning' ||
    type === 'info' ||
    /shift|berakhir|jangkauan|radius|kantor|ditutup/i.test(description);

  const bannerType = type || (isBusinessNotice ? 'warning' : 'error');

  const bannerTitle =
    title && title !== 'Error'
      ? title
      : bannerType === 'warning'
      ? 'Peringatan!'
      : bannerType === 'info'
      ? 'Pemberitahuan'
      : 'Pemberitahuan';

  let mainColor = tokens.colors.error;
  let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle-outline';
  let bgColor = 'rgba(239, 68, 68, 0.08)';
  let borderColor = 'rgba(239, 68, 68, 0.25)';

  if (bannerType === 'warning') {
    mainColor = tokens.colors.warning || '#d97706';
    iconName = 'information-circle-outline';
    bgColor = 'rgba(217, 119, 6, 0.08)';
    borderColor = 'rgba(217, 119, 6, 0.25)';
  } else if (bannerType === 'info') {
    mainColor = '#2563eb';
    iconName = 'information-circle-outline';
    bgColor = 'rgba(37, 99, 235, 0.08)';
    borderColor = 'rgba(37, 99, 235, 0.25)';
  }

  const handleDismiss = () => {
    translateY.value = withTiming(-100, timingConfig(AnimationDurations.fast));
    opacity.value = withTiming(0, timingConfig(AnimationDurations.fast), (finished) => {
      if (finished) {
        runOnJS(setVisible)(false);
        if (onDismiss) {
          runOnJS(onDismiss)();
        }
      }
    });
  };

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, timingConfig(AnimationDurations.normal));

    if (autoDismiss) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
        },
        animatedStyle,
        style,
      ]}
    >
      <Ionicons name={iconName} size={24} color={mainColor} style={styles.bannerIcon} />
      <View style={styles.bannerContent}>
        <Text style={[styles.bannerTitle, { color: mainColor, fontSize: tokens.typography.fontSize.base }]}>
          {bannerTitle}
        </Text>
        <Text style={[styles.bannerDescription, { color: tokens.colors.textPrimary, fontSize: tokens.typography.fontSize.sm }]}>
          {description}
        </Text>
      </View>
      <Pressable onPress={handleDismiss} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={18} color={tokens.colors.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    minWidth: 120,
  },
  
  // Banner styles
  bannerContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  bannerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerDescription: {
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
});
