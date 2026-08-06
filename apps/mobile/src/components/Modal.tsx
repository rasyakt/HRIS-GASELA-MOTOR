import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal as RNModal, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  runOnJS,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { AnimationDurations, timingConfig } from '../animations';
import { triggerHapticFeedback } from '../animations/gestures';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  fullScreen?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const { height: screenHeight } = Dimensions.get('window');

export function Modal({
  visible,
  onClose,
  title,
  fullScreen = false,
  children,
  actions,
}: ModalProps) {
  const { tokens } = useTheme();
  const [showModal, setShowModal] = useState(visible);
  
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      // Animate in
      backdropOpacity.value = withTiming(0.45, timingConfig(AnimationDurations.normal));
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      });
      triggerHapticFeedback('light');
    } else if (showModal) {
      // Animate out
      backdropOpacity.value = withTiming(0, timingConfig(AnimationDurations.normal));
      translateY.value = withTiming(screenHeight, timingConfig(AnimationDurations.normal), (finished) => {
        if (finished) {
          runOnJS(setShowModal)(false);
        }
      });
    }
  }, [visible, backdropOpacity, translateY, showModal]);

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!showModal) return null;

  return (
    <RNModal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.backdropPressable} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.contentContainer,
            {
              backgroundColor: tokens.colors.surface,
              ...tokens.shadows['2xl'],
            },
            fullScreen ? styles.fullScreenContent : styles.bottomSheetContent,
            contentStyle,
          ]}
        >
          {/* Drag Handle */}
          {!fullScreen && (
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: tokens.colors.neutral300 }]} />
            </View>
          )}

          {/* Header */}
          {(title || !fullScreen) && (
            <View style={[styles.header, { borderBottomColor: tokens.colors.border }]}>
              {title ? (
                <Text style={[styles.title, { color: tokens.colors.textPrimary, fontSize: tokens.typography.fontSize.xl }]}>
                  {title}
                </Text>
              ) : (
                <View />
              )}
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.5 : 1 }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={tokens.colors.textSecondary} />
              </Pressable>
            </View>
          )}

          {/* Body */}
          <View style={[styles.body, fullScreen && styles.bodyFullScreen]}>
            {children}
          </View>

          {/* Footer */}
          {actions && (
            <View style={[styles.footer, { borderTopColor: tokens.colors.border }]}>
              {actions}
            </View>
          )}
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  backdropPressable: {
    flex: 1,
  },
  contentContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  bottomSheetContent: {
    paddingBottom: 20,
  },
  fullScreenContent: {
    height: '100%',
    maxHeight: '100%',
    borderRadius: 0,
    paddingTop: 40, // For status bar
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  bodyFullScreen: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
