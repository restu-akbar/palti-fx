import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { StreakInfo } from '../lib/achievements';
import { colors, fonts } from '../theme';
import { Card } from './ui';

const native = Platform.OS !== 'web';
const FLAME = '#FF8A3D';

/** Api yang berkedip pelan (menyala saat streak aktif). */
export function Flame({ size = 22, active = true }: { size?: number; active?: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
        Animated.timing(v, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, active]);
  return (
    <Animated.View
      style={{
        transform: [
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) },
        ],
      }}
    >
      <Ionicons name="flame" size={size} color={active ? FLAME : colors.muted} />
    </Animated.View>
  );
}

/** Pil kecil streak untuk Beranda. */
export function StreakChip({ streak }: { streak: StreakInfo }) {
  const on = streak.current > 0;
  return (
    <View style={[st.chip, on && st.chipOn]}>
      <Flame size={14} active={on} />
      <Text style={[st.chipText, on && { color: '#FFB27A' }]}>
        {on ? `${streak.current} hari streak` : 'Mulai streak'}
      </Text>
    </View>
  );
}

/** Kartu streak untuk halaman Jurnal. */
export function StreakCard({ streak }: { streak: StreakInfo }) {
  const on = streak.current > 0;
  const msg = streak.today
    ? 'Mantap! Jurnal hari ini sudah tercatat.'
    : on
      ? 'Catat trade hari ini supaya streak tidak putus.'
      : 'Catat trade hari ini untuk memulai streak.';
  return (
    <Card style={{ marginBottom: 12 }} padded={false}>
      <LinearGradient
        colors={on ? ['rgba(255,138,61,0.16)', 'rgba(255,138,61,0)'] : ['transparent', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[st.flameBox, on && { backgroundColor: 'rgba(255,138,61,0.14)', borderColor: 'rgba(255,138,61,0.35)' }]}>
            <Flame size={26} active={on} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={st.big}>
              {streak.current} <Text style={st.bigUnit}>hari berturut-turut</Text>
            </Text>
            <Text style={st.sub}>
              Rekor terbaik: {streak.best} hari · libur Sabtu–Minggu tidak memutus streak
            </Text>
          </View>
        </View>

        <View style={st.week}>
          {streak.week.map((d) => (
            <View key={d.label} style={{ alignItems: 'center', flex: 1 }}>
              <View
                style={[
                  st.dot,
                  d.done && st.dotDone,
                  d.isToday && !d.done && st.dotToday,
                  d.future && { opacity: 0.35 },
                ]}
              >
                {d.done ? <Ionicons name="checkmark" size={14} color={colors.ink} /> : null}
              </View>
              <Text style={[st.dayLabel, d.isToday && { color: colors.text }]}>{d.label}</Text>
            </View>
          ))}
        </View>
        <Text style={[st.msg, streak.today && { color: colors.green }]}>{msg}</Text>
      </LinearGradient>
    </Card>
  );
}

const st = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipOn: { borderColor: 'rgba(255,138,61,0.4)', backgroundColor: 'rgba(255,138,61,0.12)' },
  chipText: { color: colors.muted, fontFamily: fonts.bold, fontSize: 12 },
  flameBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  big: { color: colors.text, fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.6 },
  bigUnit: { color: colors.textDim, fontFamily: fonts.semi, fontSize: 14, letterSpacing: 0 },
  sub: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  week: { flexDirection: 'row', marginTop: 16 },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  dotToday: { borderColor: FLAME, borderStyle: 'dashed' },
  dayLabel: { color: colors.muted, fontFamily: fonts.semi, fontSize: 11, marginTop: 6 },
  msg: { color: colors.textDim, fontFamily: fonts.medium, fontSize: 13, marginTop: 14 },
});
