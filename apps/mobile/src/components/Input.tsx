import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
  KeyboardTypeOptions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { timingConfig, AnimationDurations } from '../animations';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  prefixIcon?: keyof typeof Ionicons.glyphMap;
  suffixIcon?: keyof typeof Ionicons.glyphMap;
  onSuffixPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  value,
  onChangeText,
  error,
  helperText,
  disabled,
  prefixIcon,
  suffixIcon,
  onSuffixPress,
  containerStyle,
  secureTextEntry,
  maxLength,
  ...rest
}: InputProps) {
  const { tokens } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  // 0 = resting, 1 = floating
  const floatAnim = useDerivedValue(() => {
    return withTiming(isFloating ? 1 : 0, timingConfig(AnimationDurations.fast));
  }, [isFloating]);

  // 0 = unfocused, 1 = focused
  const focusAnim = useDerivedValue(() => {
    return withTiming(isFocused ? 1 : 0, timingConfig(AnimationDurations.fast));
  }, [isFocused]);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: floatAnim.value * -12 },
        { scale: 1 - floatAnim.value * 0.15 }, // scale down to 0.85
      ],
      color: error
        ? tokens.colors.error
        : interpolateColor(
            focusAnim.value,
            [0, 1],
            [tokens.colors.textTertiary, tokens.colors.primary]
          ),
    };
  });

  const borderAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? tokens.colors.error
      : interpolateColor(
          focusAnim.value,
          [0, 1],
          [tokens.colors.border, tokens.colors.primary]
        );
    return {
      borderColor,
    };
  });

  const isPassword = secureTextEntry !== undefined;
  const showPasswordIcon = isPassword;
  const currentSecureTextEntry = isPassword ? !isPasswordVisible : false;

  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderRadius: tokens.borderRadius.md,
            backgroundColor: tokens.colors.surface,
          },
          borderAnimatedStyle,
          disabled && { opacity: 0.5 },
        ]}
      >
        {prefixIcon && (
          <Ionicons
            name={prefixIcon}
            size={20}
            color={tokens.colors.textTertiary}
            style={styles.prefixIcon}
          />
        )}
        
        <View style={styles.inputWrapper}>
          <Animated.Text
            style={[
              styles.label,
              { fontSize: tokens.typography.fontSize.base },
              labelAnimatedStyle,
            ]}
          >
            {label}
          </Animated.Text>
          
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!disabled}
            secureTextEntry={currentSecureTextEntry}
            maxLength={maxLength}
            style={[
              styles.input,
              {
                color: tokens.colors.textPrimary,
                fontSize: tokens.typography.fontSize.base,
                paddingTop: isFloating ? 16 : 0, // adjust padding to make room for label
              },
            ]}
            placeholderTextColor="transparent" // use floating label instead
            {...rest}
          />
        </View>

        {showPasswordIcon && (
          <Pressable onPress={handleTogglePassword} style={styles.suffixIcon}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={tokens.colors.textTertiary}
            />
          </Pressable>
        )}
        {!showPasswordIcon && suffixIcon && (
          <Pressable onPress={onSuffixPress} style={styles.suffixIcon} disabled={!onSuffixPress}>
            <Ionicons name={suffixIcon} size={20} color={tokens.colors.textTertiary} />
          </Pressable>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.helperTextContainer}>
          {error ? (
            <Text style={[styles.helperText, { color: tokens.colors.error }]}>{error}</Text>
          ) : helperText ? (
            <Text style={[styles.helperText, { color: tokens.colors.textSecondary }]}>
              {helperText}
            </Text>
          ) : <View />}
        </View>
        {maxLength !== undefined && (
          <Text style={[styles.counterText, { color: tokens.colors.textTertiary }]}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 56, // Fixed height to prevent infinite stretch on Android
    paddingHorizontal: 12,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    margin: 0,
  },
  prefixIcon: {
    marginRight: 8,
  },
  suffixIcon: {
    marginLeft: 8,
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  helperTextContainer: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
  },
  counterText: {
    fontSize: 12,
    marginLeft: 8,
  },
});
