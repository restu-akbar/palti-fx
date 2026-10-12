import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Achievement, AchievementCtx, ACHIEVEMENTS, computeStreak, isUnlocked, TIER_COLORS } from '../lib/achievements';
import { useStore } from '../lib/store';
import { colors } from '../theme';

/** Medali pencapaian: berwarna sesuai tingkat (perunggu/perak/emas) bila terbuka, gelap bila terkunci. */
export function Medal({ a, unlocked, size = 64 }: { a: Achievement; unlocked: boolean; size?: number }) {
  const tc = TIER_COLORS[a.tier];
  if (!unlocked) {
    return (
      <View style={[st.base, { width: size, height: size, borderRadius: size / 2 }, st.locked]}>
        <Ionicons name={a.icon} size={size * 0.4} color="rgba(255,255,255,0.12)" />
        <View style={[st.lock, { width: size * 0.36, height: size * 0.36, borderRadius: size * 0.18 }]}>
          <Ionicons name="lock-closed" size={size * 0.17} color={colors.muted} />
        </View>
      </View>
    );
  }
  return (
    <LinearGradient
      colors={tc.grad}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[st.base, { width: size, height: size, borderRadius: size / 2 }, st.glow, { shadowColor: tc.grad[1] }]}
    >
      <View
        style={{
          position: 'absolute',
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.4,
          borderWidth: 1.5,
          borderColor: 'rgba(0,0,0,0.18)',
        }}
      />
      <Ionicons name={a.icon} size={size * 0.42} color={tc.ink} />
    </LinearGradient>
  );
}

/** Semua pencapaian beserta status terbuka & progres. */
export function useAchievements() {
  const { trades, completed, settings } = useStore();
  return useMemo(() => {
    const streak = computeStreak(trades);
    const ctx: AchievementCtx = { trades, completed, settings, streakBest: streak.best };
    const list = ACHIEVEMENTS.map((a) => {
      const [value, target] = a.progress(ctx);
      return { a, value, target, unlocked: isUnlocked(a, ctx), at: settings.unlocked?.[a.id] };
    });
    return { list, streak, unlockedCount: list.filter((x) => x.unlocked).length };
  }, [trades, completed, settings]);
}

const st = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  locked: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  lock: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: { shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
});
