import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { AnimationDurations, timingConfig } from '../animations';
import { triggerHapticFeedback } from '../animations/gestures';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { tokens, theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 6),
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              triggerHapticFeedback('light');
              navigation.navigate(route.name, route.params);
            }
          };

          // Scale animation
          const animatedStyle = useAnimatedStyle(() => {
            return {
              transform: [{ scale: withTiming(isFocused ? 1.1 : 1, timingConfig(AnimationDurations.fast)) }],
            };
          });

          // Indicator animation
          const indicatorStyle = useAnimatedStyle(() => {
            return {
              opacity: withTiming(isFocused ? 1 : 0, timingConfig(AnimationDurations.fast)),
              transform: [{ scale: withTiming(isFocused ? 1 : 0.5, timingConfig(AnimationDurations.fast)) }],
            };
          });

          const color = isFocused ? tokens.colors.primary : tokens.colors.textTertiary;

          return (
            <AnimatedPressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            >
              <Animated.View style={[styles.iconContainer, animatedStyle]}>
                {options.tabBarIcon && options.tabBarIcon({ focused: isFocused, color, size: 24 })}
                <Animated.View
                  style={[
                    styles.indicator,
                    { backgroundColor: tokens.colors.primary },
                    indicatorStyle,
                  ]}
                />
              </Animated.View>

              <Text
                style={[
                  styles.label,
                  {
                    color,
                    fontSize: 11,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {options.title !== undefined ? options.title : route.name}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    height: 58,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    height: 28,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  label: {
    textAlign: 'center',
  },
});
