import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { AnimationDurations, timingConfig, scalePress } from '../animations';
import { Skeleton } from './Loading';
import { triggerHapticFeedback } from '../animations/gestures';

export interface SwipeAction {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trailing?: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  loading?: boolean;
  hasDivider?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ListItem({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  selected = false,
  loading = false,
  hasDivider = true,
  style,
}: ListItemProps) {
  const { tokens } = useTheme();
  
  const isPressed = useSharedValue(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, timingConfig(AnimationDurations.normal));
  }, [opacity]);

  const handlePressIn = () => {
    isPressed.value = true;
  };

  const handlePressOut = () => {
    isPressed.value = false;
  };

  const handlePress = () => {
    if (onPress && !loading) {
      triggerHapticFeedback('light');
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scalePress(isPressed.value) }],
      backgroundColor: selected
        ? tokens.colors.primaryLight + '20' // 12% opacity roughly
        : 'transparent',
    };
  });

  if (loading) {
    return (
      <View style={[styles.container, hasDivider && { borderBottomWidth: 1, borderBottomColor: tokens.colors.border }, style]}>
        {icon && <Skeleton width={24} height={24} borderRadius={12} style={styles.iconContainer} />}
        <View style={styles.contentContainer}>
          <Skeleton width="60%" height={16} style={{ marginBottom: 4 }} />
          {subtitle && <Skeleton width="40%" height={12} />}
        </View>
      </View>
    );
  }

  const content = (
    <View style={[styles.container, hasDivider && !selected && { borderBottomWidth: 1, borderBottomColor: tokens.colors.border }, style]}>
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={24}
            color={selected ? tokens.colors.primary : tokens.colors.textSecondary}
          />
        </View>
      )}
      
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: selected ? tokens.colors.primary : tokens.colors.textPrimary, fontSize: tokens.typography.fontSize.base }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary, fontSize: tokens.typography.fontSize.sm }]}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.trailingContainer}>
        {trailing}
        {selected && !trailing && (
          <Ionicons name="checkmark" size={24} color={tokens.colors.primary} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '500',
  },
  subtitle: {
    marginTop: 2,
  },
  trailingContainer: {
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
