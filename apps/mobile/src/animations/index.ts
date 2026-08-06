import {
  withTiming,
  withSpring,
  WithTimingConfig,
  WithSpringConfig,
  Easing,
} from 'react-native-reanimated';

export type AnimationEasing = 'easeIn' | 'easeOut' | 'easeInOut' | 'spring' | 'linear';

export const AnimationDurations = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export const springConfig: WithSpringConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const timingConfig = (duration: number = AnimationDurations.normal): WithTimingConfig => {
  'worklet';
  return {
    duration,
    easing: Easing.inOut(Easing.ease),
  };
};

export const fadeIn = (duration = AnimationDurations.normal) => {
  'worklet';
  return withTiming(1, timingConfig(duration));
};

export const slideUp = (distance = 20, duration = AnimationDurations.normal) => {
  'worklet';
  return withTiming(0, timingConfig(duration));
};

export const scalePress = (isPressed: boolean) => {
  'worklet';
  return withTiming(isPressed ? 0.95 : 1, { duration: AnimationDurations.fast, easing: Easing.out(Easing.ease) });
};

export const springBounce = (toValue: number = 1) => {
  'worklet';
  return withSpring(toValue, springConfig);
};

export function safeAnimate(callback: () => void) {
  try {
    callback();
  } catch (error) {
    console.warn('Animation error:', error);
    // Fallback if needed
  }
}
