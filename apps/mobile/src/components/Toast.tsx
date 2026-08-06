import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { AnimationDurations, timingConfig } from '../animations';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  type: ToastType;
  message: string;
  action?: { label: string; onPress: () => void };
  duration?: number;
}

interface ToastItem extends ToastProps {
  id: string;
}

interface ToastContextValue {
  showToast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_DURATIONS = {
  info: 3000,
  success: 4000,
  warning: 4000,
  error: 5000,
};

function ToastMessage({
  toast,
  onRemove,
  index,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
  index: number;
}) {
  const { tokens, theme } = useTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const duration = toast.duration || TOAST_DURATIONS[toast.type];

  const handleClose = useCallback(() => {
    translateY.value = withTiming(-100, timingConfig(AnimationDurations.fast));
    opacity.value = withTiming(0, timingConfig(AnimationDurations.fast), (finished) => {
      if (finished) {
        runOnJS(onRemove)(toast.id);
      }
    });
  }, [onRemove, toast.id, translateY, opacity]);

  useEffect(() => {
    // Entrance
    translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, timingConfig(AnimationDurations.normal));

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
      // Stack offset
      marginTop: index > 0 ? 8 : 0,
    };
  });

  const getIconAndColor = () => {
    switch (toast.type) {
      case 'success':
        return { icon: 'checkmark-circle' as const, color: tokens.colors.success };
      case 'error':
        return { icon: 'close-circle' as const, color: tokens.colors.error };
      case 'warning':
        return { icon: 'warning' as const, color: tokens.colors.warning };
      case 'info':
      default:
        return { icon: 'information-circle' as const, color: tokens.colors.info };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Animated.View style={[styles.toastWrapper, animatedStyle]}>
      <BlurView intensity={85} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.blurView}>
        <View style={styles.contentContainer}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: color },
            ]}
          />
          <Ionicons name={icon} size={24} color={color} style={styles.icon} />
          <Text style={[styles.message, { color: tokens.colors.textPrimary }]}>
            {toast.message}
          </Text>
          {toast.action && (
            <Pressable
              onPress={() => {
                toast.action?.onPress();
                handleClose();
              }}
              style={styles.actionButton}
            >
              <Text style={[styles.actionLabel, { color }]}>{toast.action.label}</Text>
            </Pressable>
          )}
        </View>
      </BlurView>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...props, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.providerContainer} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastMessage key={toast.id} toast={toast} onRemove={removeToast} index={index} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  providerContainer: {
    ...StyleSheet.absoluteFill,
    paddingTop: 50, // Safe area approx
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toastWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  blurView: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
});
