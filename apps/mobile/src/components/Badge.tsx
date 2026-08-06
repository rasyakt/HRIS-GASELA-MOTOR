import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface BadgeProps {
  variant?: 'solid' | 'outlined' | 'subtle';
  color?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children?: string | number;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Badge({
  variant = 'solid',
  color = 'error',
  children,
  dot = false,
  style,
}: BadgeProps) {
  const { tokens } = useTheme();

  const getBaseColor = () => {
    switch (color) {
      case 'success': return tokens.colors.success;
      case 'warning': return tokens.colors.warning;
      case 'info': return tokens.colors.info;
      case 'neutral': return tokens.colors.neutral500;
      case 'error':
      default: return tokens.colors.error;
    }
  };

  const getSubtleColor = () => {
    switch (color) {
      case 'success': return tokens.colors.successLight;
      case 'warning': return tokens.colors.warningLight;
      case 'info': return tokens.colors.infoLight;
      case 'neutral': return tokens.colors.neutral200;
      case 'error':
      default: return tokens.colors.errorLight;
    }
  };

  const getBackgroundColor = () => {
    if (variant === 'outlined') return 'transparent';
    if (variant === 'subtle') return getSubtleColor();
    return getBaseColor();
  };

  const getTextColor = () => {
    if (variant === 'solid') return '#ffffff'; // always white/high contrast for solid
    return getBaseColor();
  };

  const getBorderColor = () => {
    if (variant === 'outlined') return getBaseColor();
    return 'transparent';
  };

  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();
  const borderColor = getBorderColor();

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          { backgroundColor, borderColor, borderWidth: variant === 'outlined' ? 1 : 0 },
          tokens.shadows.sm,
          style,
        ]}
      />
    );
  }

  let displayValue = children;
  if (typeof children === 'number') {
    displayValue = children > 99 ? '99+' : children;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'outlined' ? 1 : 0,
        },
        tokens.shadows.sm,
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{displayValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 20,
    minWidth: 20,
    borderRadius: 999,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
