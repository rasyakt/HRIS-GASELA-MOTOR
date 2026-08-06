import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { scalePress } from '../animations';
import { triggerHapticFeedback } from '../animations/gestures';

export interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'gradient';
  elevation?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export interface CardHeaderProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  action?: React.ReactNode;
  hasDivider?: boolean;
}

export interface CardContentProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export interface CardFooterProps {
  children: React.ReactNode;
  hasDivider?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({ variant = 'default', elevation = 'md', children, onPress, style }: CardProps) {
  const { tokens } = useTheme();
  const isPressed = useSharedValue(false);

  const handlePressIn = () => {
    isPressed.value = true;
  };

  const handlePressOut = () => {
    isPressed.value = false;
  };

  const handlePress = () => {
    if (onPress) {
      triggerHapticFeedback('light');
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scalePress(isPressed.value) }],
    };
  });

  const getBackgroundColor = () => {
    if (variant === 'gradient') return 'transparent';
    return tokens.colors.surface;
  };

  const getBorderProps = () => {
    if (variant === 'outlined') {
      return { borderWidth: 1, borderColor: tokens.colors.border };
    }
    return { borderWidth: 0, borderColor: 'transparent' };
  };

  const getShadowProps = () => {
    if (variant === 'elevated' || variant === 'default') {
      return tokens.shadows[elevation];
    }
    return {};
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      borderRadius: tokens.borderRadius.lg,
      ...getBorderProps(),
      ...getShadowProps(),
    },
    style,
  ];

  const content = (
    <>
      {variant === 'gradient' && (
        <LinearGradient
          colors={tokens.gradients.primary}
          style={[StyleSheet.absoluteFill, { borderRadius: tokens.borderRadius.lg }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <View style={styles.inner}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={cardStyle}
      >
        <Animated.View style={animatedStyle}>{content}</Animated.View>
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

export function CardHeader({ icon, title, action, hasDivider = false }: CardHeaderProps) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.header, hasDivider && { borderBottomWidth: 1, borderBottomColor: tokens.colors.border }]}>
      <View style={styles.headerLeft}>
        {icon && <Ionicons name={icon} size={20} color={tokens.colors.textPrimary} style={styles.headerIcon} />}
        <Text style={[styles.title, { color: tokens.colors.textPrimary, fontSize: tokens.typography.fontSize.lg }]}>
          {title}
        </Text>
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

export function CardContent({ children, noPadding = false }: CardContentProps) {
  return <View style={[styles.content, noPadding && styles.noPadding]}>{children}</View>;
}

export function CardFooter({ children, hasDivider = false }: CardFooterProps) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.footer, hasDivider && { borderTopWidth: 1, borderTopColor: tokens.colors.border }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    width: '100%',
  },
  inner: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  noPadding: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
