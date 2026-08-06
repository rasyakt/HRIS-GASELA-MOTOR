import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { scalePress } from '../animations';
import { triggerHapticFeedback } from '../animations/gestures';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  onPress: () => void;
  children: string | React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onPress,
  children,
  style,
  fullWidth = false,
}: ButtonProps) {
  const { tokens } = useTheme();
  const isPressed = useSharedValue(false);

  const handlePressIn = () => {
    isPressed.value = true;
  };

  const handlePressOut = () => {
    isPressed.value = false;
  };

  const handlePress = () => {
    if (disabled || loading) return;
    triggerHapticFeedback('light');
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scalePress(isPressed.value) }],
    };
  });

  // Derived styles based on variant and size
  const getHeight = () => {
    switch (size) {
      case 'small': return 36;
      case 'large': return 52;
      case 'medium':
      default: return 44;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return tokens.typography.fontSize.sm;
      case 'large': return tokens.typography.fontSize.lg;
      case 'medium':
      default: return tokens.typography.fontSize.base;
    }
  };

  const getBackgroundColor = () => {
    if (variant === 'gradient' || variant === 'outline' || variant === 'ghost') return 'transparent';
    switch (variant) {
      case 'secondary': return tokens.colors.secondary;
      case 'destructive': return tokens.colors.error;
      case 'primary':
      default: return tokens.colors.primary;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return tokens.colors.primary;
    }
    if (variant === 'secondary') return tokens.colors.textPrimary;
    return tokens.colors.textInverse; // primary, destructive, gradient
  };

  const getBorderColor = () => {
    if (variant === 'outline') return tokens.colors.border;
    return 'transparent';
  };

  const height = getHeight();
  const fontSize = getFontSize();
  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();
  const borderColor = getBorderColor();

  const content = (
    <View style={styles.contentContainer}>
      {loading && <ActivityIndicator color={textColor} style={styles.spinner} />}
      {!loading && icon && iconPosition === 'left' && (
        <Ionicons name={icon} size={fontSize * 1.2} color={textColor} style={styles.iconLeft} />
      )}
      {typeof children === 'string' ? (
        <Text style={[styles.text, { fontSize, color: textColor }]}>{children}</Text>
      ) : (
        children
      )}
      {!loading && icon && iconPosition === 'right' && (
        <Ionicons name={icon} size={fontSize * 1.2} color={textColor} style={styles.iconRight} />
      )}
    </View>
  );

  const buttonStyle = [
    styles.button,
    {
      height,
      backgroundColor,
      borderColor,
      borderWidth: variant === 'outline' ? 1 : 0,
      borderRadius: tokens.borderRadius.base,
      opacity: disabled ? 0.5 : 1,
      minWidth: fullWidth ? '100%' : undefined,
    },
    style,
  ];

  const pressableProps = {
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    onPress: handlePress,
    disabled: disabled || loading,
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityState: { disabled },
    style: buttonStyle,
    // Ensure minimum touch target for accessibility
    hitSlop: size === 'small' ? { top: 4, bottom: 4, left: 4, right: 4 } : undefined,
  };

  return (
    <AnimatedPressable {...pressableProps}>
      <Animated.View style={[styles.inner, animatedStyle]}>
        {variant === 'gradient' && (
          <LinearGradient
            colors={tokens.gradients.primary as [string, string, ...string[]]}
            style={[StyleSheet.absoluteFill, { borderRadius: tokens.borderRadius.base }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        )}
        {content}
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden', // to contain gradient
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
