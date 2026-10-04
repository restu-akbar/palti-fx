import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Medal, useAchievements } from '../components/Medal';
import { AnimatedBar, FadeIn, PressScale, ProgressRing } from '../components/motion';
import { Flame } from '../components/Streak';
import { Card, Chip, Screen, Sheet } from '../components/ui';
import { TIER_COLORS } from '../lib/achievements';
import { fmtDate } from '../lib/format';
import { colors, fonts } from '../theme';

export function AchievementsScreen() {
  const { list, unlockedCount, streak } = useAchievements();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = list.find((x) => x.a.id === openId) ?? null;
  const [lastOpen, setLastOpen] = useState(open);
  if (open && open !== lastOpen) setLastOpen(open);
  const shown = open ?? lastOpen;

  // yang terbuka dulu, lalu yang paling dekat selesai
  const sorted = [...list].sort((x, y) =>
    x.unlocked !== y.unlocked ? (x.unlocked ? -1 : 1) : y.value / y.target - x.value / x.target,
  );

  return (
    <Screen title="Pencapaian" eyebrow="INNER CIRCLE" subtitle="Kumpulkan medali dari disiplin & belajar">
      <FadeIn delay={60}>
        <Card gold style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ProgressRing value={unlockedCount / list.length} size={72} stroke={7} track="rgba(255,255,255,0.08)">
            <Text style={st.ringText}>
              {unlockedCount}/{list.length}
            </Text>
          </ProgressRing>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={st.title}>Medali terkumpul</Text>
            <Text style={st.sub}>
              {unlockedCount === list.length ? 'Semua medali sudah kamu raih!' : 'Terus catat & belajar untuk membuka medali baru'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Flame size={14} active={streak.current > 0} />
              <Text style={st.streakText}>
                Streak {streak.current} hari · rekor {streak.best}
              </Text>
            </View>
          </View>
        </Card>
      </FadeIn>

      <View style={st.grid}>
        {sorted.map((x, i) => (
          <FadeIn key={x.a.id} delay={120 + i * 45} from="scale" style={st.cell}>
            <PressScale onPress={() => setOpenId(x.a.id)} style={st.cellInner}>
              <Medal a={x.a} unlocked={x.unlocked} size={62} />
              <Text style={[st.cellTitle, !x.unlocked && { color: colors.textDim }]} numberOfLines={2}>
                {x.a.title}
              </Text>
              {x.unlocked ? (
                <Text style={[st.cellTier, { color: TIER_COLORS[x.a.tier].grad[1] }]}>{TIER_COLORS[x.a.tier].label}</Text>
              ) : (
                <View style={{ width: '80%', marginTop: 8 }}>
                  <AnimatedBar value={x.value / x.target} height={4} delay={300 + i * 45} />
                  <Text style={st.cellProg}>
                    {x.value}/{x.target}
                  </Text>
                </View>
              )}
            </PressScale>
          </FadeIn>
        ))}
      </View>

      <Sheet visible={!!open} onClose={() => setOpenId(null)} title=" ">
        {shown && (
          <View style={{ alignItems: 'center' }}>
            <Medal a={shown.a} unlocked={shown.unlocked} size={104} />
            <Text style={st.sheetTitle}>{shown.a.title}</Text>
            <View style={{ marginTop: 8 }}>
              <Chip
                label={shown.unlocked ? `Medali ${TIER_COLORS[shown.a.tier].label}` : 'Terkunci'}
                color={shown.unlocked ? TIER_COLORS[shown.a.tier].grad[1] : colors.muted}
              />
            </View>
            <Text style={st.sheetDesc}>{shown.a.desc}</Text>
            {shown.unlocked ? (
              <View style={st.sheetRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                <Text style={st.sheetInfo}>
                  {shown.at ? `Terbuka ${fmtDate(new Date(shown.at).toISOString().slice(0, 10))}` : 'Sudah terbuka'}
                </Text>
              </View>
            ) : (
              <View style={{ width: '100%', marginTop: 18 }}>
                <AnimatedBar value={shown.value / shown.target} height={8} delay={100} />
                <Text style={[st.sheetInfo, { textAlign: 'center', marginTop: 8 }]}>
                  Progres {shown.value} dari {shown.target}
                </Text>
              </View>
            )}
          </View>
        )}
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  ringText: { color: colors.goldLight, fontFamily: fonts.display, fontSize: 16 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 17 },
  sub: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, marginTop: 3 },
  streakText: { color: colors.textDim, fontFamily: fonts.semi, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 18, marginHorizontal: -5 },
  cell: { width: '33.333%', padding: 5 },
  cellInner: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    minHeight: 158,
  },
  cellTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 12.5, textAlign: 'center', marginTop: 12, minHeight: 32 },
  cellTier: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1, marginTop: 6, textTransform: 'uppercase' },
  cellProg: { color: colors.muted, fontFamily: fonts.semi, fontSize: 10, textAlign: 'center', marginTop: 4 },
  sheetTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 24, marginTop: 16, letterSpacing: -0.4 },
  sheetDesc: { color: colors.textDim, fontFamily: fonts.body, fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  sheetInfo: { color: colors.textDim, fontFamily: fonts.semi, fontSize: 13 },
});
