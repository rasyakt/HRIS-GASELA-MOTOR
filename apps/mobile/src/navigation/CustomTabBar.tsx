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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BlurView
        intensity={80}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme === 'dark' ? 'rgba(9, 9, 11, 0.7)' : 'rgba(255, 255, 255, 0.8)' }
        ]}
      />
      <View
        style={[
          styles.content,
          {
            borderTopColor: tokens.colors.border,
            ...tokens.shadows.sm,
          }
        ]}
      >
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
              transform: [{ scale: withTiming(isFocused ? 1.15 : 1, timingConfig(AnimationDurations.fast)) }],
            };
          });

          // Indicator animation
          const indicatorStyle = useAnimatedStyle(() => {
            return {
              opacity: withTiming(isFocused ? 1 : 0, timingConfig(AnimationDurations.fast)),
              transform: [{ translateY: withTiming(isFocused ? 0 : 4, timingConfig(AnimationDurations.fast)) }],
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
                    indicatorStyle
                  ]}
                />
              </Animated.View>
              
              <Text
                style={[
                  styles.label,
                  { color, fontSize: 10, fontWeight: isFocused ? '600' : '500' }
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
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    height: 32,
  },
  indicator: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  label: {
    textAlign: 'center',
  },
});
