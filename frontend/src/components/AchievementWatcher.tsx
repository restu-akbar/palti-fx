import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { TIER_COLORS } from '../lib/achievements';
import { useStore } from '../lib/store';
import { useNav } from '../nav';
import { colors, fonts } from '../theme';
import { Medal, useAchievements } from './Medal';
import { tap } from './motion';
import { GoldButton } from './ui';

const native = Platform.OS !== 'web';

/**
 * Memantau pencapaian. Saat ada yang baru terbuka, simpan waktunya
 * lalu tampilkan perayaan (satu per satu bila lebih dari satu).
 */
export function AchievementWatcher() {
  const { ready, settings, updateSettings } = useStore();
  const { list } = useAchievements();
  const nav = useNav();
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    if (!ready || !settings.welcomed) return; // tunggu sampai layar sambutan selesai
    const known = settings.unlocked ?? {};
    const fresh = list.filter((x) => x.unlocked && !known[x.a.id]).map((x) => x.a.id);
    if (!fresh.length) return;
    const now = Date.now();
    const next = { ...known };
    fresh.forEach((id) => (next[id] = now));
    updateSettings({ unlocked: next });
    setQueue((q) => [...q, ...fresh.filter((id) => !q.includes(id))]);
  }, [ready, settings.welcomed, settings.unlocked, list, updateSettings]);

  const current = list.find((x) => x.a.id === queue[0]);
  if (!current) return null;
  return (
    <Celebration
      key={current.a.id}
      item={current}
      more={queue.length - 1}
      onClose={() => setQueue((q) => q.slice(1))}
      onSeeAll={() => {
        setQueue([]);
        nav.go('home', { name: 'achievements' });
      }}
    />
  );
}

function Celebration({
  item,
  more,
  onClose,
  onSeeAll,
}: {
  item: ReturnType<typeof useAchievements>['list'][number];
  more: number;
  onClose: () => void;
  onSeeAll: () => void;
}) {
  const bg = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const tc = TIER_COLORS[item.a.tier];

  useEffect(() => {
    tap('success');
    Animated.parallel([
      Animated.timing(bg, { toValue: 1, duration: 250, useNativeDriver: native }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: native, speed: 8, bounciness: 14, delay: 120 }),
    ]).start();
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: native }),
    );
    loop.start();
    return () => loop.stop();
  }, [bg, pop, spin]);

  const rays = Array.from({ length: 12 });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[st.backdrop, { opacity: bg }]}>
        <Animated.View
          style={[
            st.box,
            {
              opacity: pop,
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
            },
          ]}
        >
          <Text style={st.eyebrow}>PENCAPAIAN BARU</Text>

          <View style={st.medalWrap}>
            {/* sinar berputar di belakang medali */}
            <Animated.View
              style={[
                st.rays,
                { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
              ]}
            >
              {rays.map((_, i) => (
                <View
                  key={i}
                  style={[
                    st.ray,
                    { backgroundColor: tc.grad[1], transform: [{ rotate: `${i * 30}deg` }, { translateY: -70 }] },
                  ]}
                />
              ))}
            </Animated.View>
            <Animated.View
              style={{
                transform: [
                  { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                  { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-120deg', '0deg'] }) },
                ],
              }}
            >
              <Medal a={item.a} unlocked size={116} />
            </Animated.View>
          </View>

          <Text style={st.title}>{item.a.title}</Text>
          <Text style={[st.tier, { color: tc.grad[1] }]}>Medali {tc.label}</Text>
          <Text style={st.desc}>{item.a.desc}</Text>

          <GoldButton title={more > 0 ? `Mantap! (+${more} lagi)` : 'Mantap!'} onPress={onClose} style={{ alignSelf: 'stretch', marginTop: 22 }} />
          <Text style={st.link} onPress={onSeeAll}>
            Lihat semua pencapaian
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  box: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderGold,
    padding: 24,
    alignItems: 'center',
  },
  eyebrow: { color: colors.gold, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 3 },
  medalWrap: { width: 200, height: 190, alignItems: 'center', justifyContent: 'center' },
  rays: { position: 'absolute', width: 1, height: 1, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 4, height: 26, borderRadius: 2, opacity: 0.45 },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.4, textAlign: 'center' },
  tier: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1, marginTop: 4, textTransform: 'uppercase' },
  desc: { color: colors.textDim, fontFamily: fonts.body, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  link: { color: colors.gold, fontFamily: fonts.semi, fontSize: 13, marginTop: 14 },
});
