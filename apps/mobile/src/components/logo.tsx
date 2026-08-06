import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface GaselaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  isLight?: boolean;
}

export function GaselaLogo({ size = 'md', showText = true, isLight = false }: GaselaLogoProps) {
  const boxSizes = {
    sm: 40,
    md: 52,
    lg: 68,
  };

  const svgSizes = {
    sm: 30,
    md: 40,
    lg: 54,
  };

  const boxSize = boxSizes[size];
  const svgSize = svgSizes[size];

  return (
    <View style={styles.container}>
      <View style={[styles.box, { width: boxSize, height: boxSize, borderRadius: boxSize * 0.28 }]}>
        <Svg width={svgSize} height={svgSize} viewBox="0 0 40 40" fill="none">
          <Path
            d="M26 12C23.5 9.5 19.5 9 15.5 10.5C11.5 12 9 16 9 20.5C9 25 11.5 29 15.5 30.5C19.5 32 24 31 27 28C29 26 30 23.5 30 21H20"
            stroke="url(#g_gradient_mobile)"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 20H15L18 14L22 26L25 20H30"
            stroke="#10B981"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
          <Defs>
            <LinearGradient id="g_gradient_mobile" x1="9" y1="9" x2="30" y2="31">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="0.5" stopColor="#E4E4E7" />
              <Stop offset="1" stopColor="#71717A" />
            </LinearGradient>
          </Defs>
        </Svg>
      </View>

      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.title, isLight ? styles.textLight : styles.textDark]}>
            Gasela<Text style={styles.emerald}>Pulse</Text>
          </Text>
          <Text style={[styles.subtitle, isLight ? styles.subLight : styles.subDark]}>
            GASELA MOTOR · HRIS
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  box: {
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  emerald: {
    color: '#10B981',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  textLight: { color: '#ffffff' },
  textDark: { color: '#09090b' },
  subLight: { color: '#a1a1aa' },
  subDark: { color: '#71717a' },
});
