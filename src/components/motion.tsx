import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

const native = Platform.OS !== 'web';

export function tap(kind: 'light' | 'select' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'select') Haptics.selectionAsync();
    else if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* haptics tidak tersedia */
  }
}

/** Muncul dengan fade + geser, bisa diberi delay untuk efek berurutan (stagger). */
export function FadeIn({
  children,
  delay = 0,
  from = 'up',
  distance = 18,
  duration = 480,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  from?: 'up' | 'right' | 'left' | 'none' | 'scale';
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native,
    }).start();
  }, [v, delay, duration]);
  const transform =
    from === 'up'
      ? [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }]
      : from === 'right'
        ? [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }]
        : from === 'left'
          ? [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }) }]
          : from === 'scale'
            ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }]
            : [];
  return <Animated.View style={[{ opacity: v, transform }, style]}>{children}</Animated.View>;
}

/** Pressable dengan efek pegas mengecil saat ditekan + getar halus. */
export function PressScale({
  children,
  onPress,
  style,
  scaleTo = 0.965,
  haptic = true,
  accessibilityLabel,
  hitSlop,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  accessibilityLabel?: string;
  hitSlop?: number;
}) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(s, { toValue: v, useNativeDriver: native, speed: 40, bounciness: v === 1 ? 8 : 0 }).start();
  return (
    <Pressable
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
    >
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Angka yang berhitung naik/turun dengan halus. */
export function CountUp({
  value,
  format,
  style,
  duration = 900,
}: {
  value: number;
  format: (n: number) => string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    const t0 = Date.now();
    let raf: number;
    const step = () => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      const cur = start + (value - start) * e;
      setShown(cur);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration]);
  return <Text style={style}>{format(isFinite(shown) ? shown : value)}</Text>;
}

/** Bar progres yang terisi dengan animasi. */
export function AnimatedBar({
  value,
  height = 6,
  color = colors.gold,
  track = 'rgba(255,255,255,0.08)',
  delay = 150,
}: {
  value: number;
  height?: number;
  color?: string;
  track?: string;
  delay?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: Math.max(0, Math.min(1, value)),
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [v, value, delay]);
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
          width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

/** Cincin progres (SVG) yang teranimasi. */
export function ProgressRing({
  value,
  size = 72,
  stroke = 7,
  track = 'rgba(0,0,0,0.18)',
  color,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  track?: string;
  color?: string;
  children?: React.ReactNode;
}) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const target = Math.max(0, Math.min(1, value));
    const t0 = Date.now();
    let raf: number;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / 1100);
      setP(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.goldLight} />
            <Stop offset="1" stopColor={colors.goldDark} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? 'url(#ring)'}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/** Titik berdenyut untuk status "live". */
export function Pulse({ color = colors.green, size = 8 }: { color?: string; size?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: native }),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <View style={{ width: size * 2.6, height: size * 2.6, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

/** Kilau cahaya yang menyapu permukaan (untuk kartu emas). */
export function Shimmer({ width = 360, every = 4200 }: { width?: number; every?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        Animated.delay(every - 2200),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, every]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -40,
        bottom: -40,
        width: 70,
        backgroundColor: 'rgba(255,255,255,0.28)',
        transform: [
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-120, width + 60] }) },
          { rotate: '20deg' },
        ],
      }}
    />
  );
}

/** Mengambang pelan naik-turun (untuk elemen dekoratif). */
export function Float({ children, amount = 6, duration = 2600 }: { children: React.ReactNode; amount?: number; duration?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  return (
    <Animated.View style={{ transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -amount] }) }] }}>
      {children}
    </Animated.View>
  );
}
