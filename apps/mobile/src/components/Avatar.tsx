import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarShape = 'circle' | 'rounded';
type AvatarStatus = 'online' | 'offline' | 'busy';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  showStatus?: boolean;
  status?: AvatarStatus;
  border?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({
  uri,
  name,
  size = 'md',
  shape = 'circle',
  showStatus = false,
  status = 'offline',
  border = false,
  style,
}: AvatarProps) {
  const { tokens } = useTheme();
  const [imgError, setImgError] = useState(false);

  const getSize = () => {
    switch (size) {
      case 'xs': return 32;
      case 'sm': return 40;
      case 'lg': return 64;
      case 'xl': return 96;
      case 'md':
      default: return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'xs': return 12;
      case 'sm': return 14;
      case 'lg': return 24;
      case 'xl': return 36;
      case 'md':
      default: return 18;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return tokens.colors.success;
      case 'busy': return tokens.colors.error;
      case 'offline':
      default: return tokens.colors.neutral400;
    }
  };

  const sizeValue = getSize();
  const borderRadius = shape === 'circle' ? sizeValue / 2 : tokens.borderRadius.base;
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '?';

  const containerStyle = [
    styles.container,
    {
      width: sizeValue,
      height: sizeValue,
      borderRadius,
      backgroundColor: tokens.colors.neutral200,
    },
    border && {
      borderWidth: 2,
      borderColor: tokens.colors.surface,
    },
    style,
  ];

  return (
    <View style={styles.wrapper}>
      <View style={containerStyle}>
        {!uri || imgError ? (
          <LinearGradient
            colors={tokens.gradients.primary}
            style={[StyleSheet.absoluteFill, { borderRadius, justifyContent: 'center', alignItems: 'center' }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.initials, { fontSize: getFontSize(), color: tokens.colors.textInverse }]}>
              {initials}
            </Text>
          </LinearGradient>
        ) : (
          <Image
            source={{ uri }}
            style={[styles.image, { width: '100%', height: '100%', borderRadius }]}
            onError={() => setImgError(true)}
          />
        )}
      </View>
      
      {showStatus && (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: getStatusColor(),
              borderColor: tokens.colors.surface,
              width: sizeValue * 0.25,
              height: sizeValue * 0.25,
              borderRadius: sizeValue * 0.125,
              borderWidth: 2,
              bottom: shape === 'circle' ? sizeValue * 0.05 : -sizeValue * 0.05,
              right: shape === 'circle' ? sizeValue * 0.05 : -sizeValue * 0.05,
            },
          ]}
        />
      )}
    </View>
  );
}

export interface AvatarGroupProps {
  avatars: AvatarProps[];
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const { tokens } = useTheme();
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const getSize = () => {
    switch (size) {
      case 'xs': return 32;
      case 'sm': return 40;
      case 'lg': return 64;
      case 'xl': return 96;
      case 'md':
      default: return 48;
    }
  };
  
  const sizeValue = getSize();

  return (
    <View style={styles.groupContainer}>
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={{
            marginLeft: index > 0 ? -sizeValue * 0.3 : 0,
            zIndex: avatars.length - index,
          }}
        >
          <Avatar {...avatar} size={size} border />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={{
            marginLeft: -sizeValue * 0.3,
            zIndex: 0,
            width: sizeValue,
            height: sizeValue,
            borderRadius: sizeValue / 2,
            backgroundColor: tokens.colors.neutral200,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: tokens.colors.surface,
          }}
        >
          <Text style={{ fontSize: sizeValue * 0.3, fontWeight: '600', color: tokens.colors.textSecondary }}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
