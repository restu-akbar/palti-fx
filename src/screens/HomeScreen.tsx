import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EquityChart } from '../components/EquityChart';
import { LogoMark } from '../components/Logo';
import { MarketSessions } from '../components/MarketSessions';
import { AnimatedBar, CountUp, FadeIn, Float, PressScale, ProgressRing, Shimmer } from '../components/motion';
import { Card, Chip, GoldButton, IconBadge, IconName, SectionTitle, Sheet } from '../components/ui';
import { Medal, useAchievements } from '../components/Medal';
import { StreakChip } from '../components/Streak';
import { ALL_LESSONS, MODULES } from '../data/modules';
import { pct, signedUsd } from '../lib/format';
import { greeting } from '../lib/sessions';
import { computeStats, useStore } from '../lib/store';
import { ToolId, useNav } from '../nav';
import { colors, fonts, goldGradient, heroGradient } from '../theme';

const TIPS = [
  'Lindungi modal dulu, profit akan mengikuti.',
  'Rencanakan trade-mu, lalu jalankan rencanamu.',
  'Satu trade tidak menentukan segalanya. Konsistensi yang menentukan.',
  'Stop loss adalah biaya bisnis, bukan kegagalan.',
  'Pasar selalu ada besok. Modal belum tentu.',
  'Kesabaran menunggu setup terbaik adalah keunggulan.',
  'Evaluasi jurnal setiap minggu, perbaiki satu hal setiap kali.',
];

const QUICK: { id: ToolId; label: string; icon: IconName }[] = [
  { id: 'lot', label: 'Lot Size', icon: 'layers' },
  { id: 'rr', label: 'Risk Reward', icon: 'git-compare' },
  { id: 'pip', label: 'Nilai Pip', icon: 'pricetag' },
  { id: 'margin', label: 'Margin', icon: 'wallet' },
  { id: 'pl', label: 'Profit Loss', icon: 'cash' },
  { id: 'compound', label: 'Compound', icon: 'trending-up' },
];

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function HomeScreen() {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { trades, completed, settings, updateSettings } = useStore();
  const { list: achList, unlockedCount, streak } = useAchievements();
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const memberName = settings.name?.trim() || 'Member';
  const medalsPreview = [...achList]
    .sort((x, y) => (x.unlocked !== y.unlocked ? (x.unlocked ? -1 : 1) : (y.at ?? 0) - (x.at ?? 0)))
    .slice(0, 5);
  const stats = useMemo(() => computeStats(trades), [trades]);
  const doneCount = ALL_LESSONS.filter((l) => completed[l.id]).length;
  const progress = ALL_LESSONS.length ? doneCount / ALL_LESSONS.length : 0;
  const nextLesson = ALL_LESSONS.find((l) => !completed[l.id]);
  const now = new Date();
  const [heroW, setHeroW] = useState(360);
  const tip = TIPS[now.getDate() % TIPS.length];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* top bar */}
      <FadeIn from="none" duration={600}>
        <View style={st.top}>
          <LogoMark size={44} />
          <View style={{ flex: 1 }} />
          <View style={st.datePill}>
            <Ionicons name="calendar-clear-outline" size={13} color={colors.gold} />
            <Text style={st.dateText}>
              {now.getDate()} {BULAN[now.getMonth()].slice(0, 3)}
            </Text>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Text style={st.hello}>{greeting(now)},</Text>
        <PressScale
          scaleTo={0.98}
          haptic={false}
          onPress={() => {
            setNameDraft(settings.name ?? '');
            setNameOpen(true);
          }}
          style={st.nameRow}
          accessibilityLabel="Ubah nama panggilan"
        >
          <Text style={st.helloBig} numberOfLines={1}>
            {memberName}
          </Text>
          <VipBadge />
        </PressScale>
        <View style={st.dayRow}>
          <Text style={st.day}>
            {HARI[now.getDay()]}, {now.getDate()} {BULAN[now.getMonth()]} {now.getFullYear()}
          </Text>
          <PressScale onPress={() => nav.go('journal')} haptic={false}>
            <StreakChip streak={streak} />
          </PressScale>
        </View>
      </FadeIn>

      {/* hero progres belajar */}
      <FadeIn delay={160} from="scale">
        <PressScale
          scaleTo={0.98}
          onPress={() =>
            nextLesson
              ? nav.go('edu', { name: 'lesson', params: { moduleId: nextLesson.moduleId, lessonId: nextLesson.id } })
              : nav.go('edu')
          }
        >
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.hero}
            onLayout={(e) => setHeroW(e.nativeEvent.layout.width)}
          >
            <View style={st.heroDeco} pointerEvents="none">
              <Float amount={5}>
                <LogoMark size={190} variant="ink" opacity={0.09} />
              </Float>
            </View>
            <Shimmer width={heroW} />
            <Text style={st.heroEyebrow}>AKADEMI PALTI FX</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <ProgressRing value={progress} size={78} stroke={8} track="rgba(22,17,10,0.15)" color={colors.ink}>
                <Text style={st.ringText}>{Math.round(progress * 100)}%</Text>
              </ProgressRing>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={st.heroTitle}>{nextLesson ? 'Lanjutkan belajar' : 'Semua materi selesai!'}</Text>
                <Text style={st.heroSub} numberOfLines={2}>
                  {nextLesson ? nextLesson.title : 'Ulangi materi kapan saja'}
                </Text>
                <Text style={st.heroMeta}>
                  {doneCount}/{ALL_LESSONS.length} materi · {MODULES.length} modul
                </Text>
              </View>
            </View>
            <View style={st.heroBtn}>
              <Text style={st.heroBtnText}>{nextLesson ? 'Mulai materi' : 'Buka modul'}</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.goldLight} />
            </View>
          </LinearGradient>
        </PressScale>
      </FadeIn>

      {/* pencapaian */}
      <FadeIn delay={220}>
        <SectionTitle action="Lihat" onAction={() => nav.push({ name: 'achievements' })}>
          Pencapaian
        </SectionTitle>
        <Card onPress={() => nav.push({ name: 'achievements' })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {medalsPreview.map((x) => (
              <Medal key={x.a.id} a={x.a} unlocked={x.unlocked} size={48} />
            ))}
          </View>
          <View style={st.achRow}>
            <Text style={st.achText}>
              <Text style={{ color: colors.goldLight, fontFamily: fonts.display }}>{unlockedCount}</Text> dari{' '}
              {achList.length} medali terbuka
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gold} />
          </View>
        </Card>
      </FadeIn>

      {/* tools */}
      <FadeIn delay={240}>
        <SectionTitle action="Semua" onAction={() => nav.go('tools')}>
          Kalkulator
        </SectionTitle>
      </FadeIn>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -18 }}
        contentContainerStyle={{ paddingHorizontal: 18, gap: 10 }}
      >
        {QUICK.map((q, i) => (
          <FadeIn key={q.id} delay={280 + i * 60} from="right">
            <PressScale onPress={() => nav.go('tools', { name: 'tool', params: { toolId: q.id } })} style={st.tool}>
              <IconBadge name={q.icon} size={20} box={44} solid={i === 0} />
              <Text style={st.toolText}>{q.label}</Text>
            </PressScale>
          </FadeIn>
        ))}
      </ScrollView>

      {/* sesi pasar */}
      <FadeIn delay={360}>
        <SectionTitle>Pasar Hari Ini</SectionTitle>
        <MarketSessions />
      </FadeIn>

      {/* performa jurnal */}
      <FadeIn delay={420}>
        <SectionTitle action="Jurnal" onAction={() => nav.go('journal')}>
          Performa Kamu
        </SectionTitle>
        <Card onPress={() => nav.go('journal', stats.count ? undefined : { name: 'tradeForm', params: {} })}>
          {stats.count ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={st.perfLabel}>Net profit / loss</Text>
                  <CountUp
                    value={stats.net}
                    format={(n) => signedUsd(n)}
                    style={[st.perfValue, { color: stats.net >= 0 ? colors.green : colors.red }]}
                  />
                </View>
                <Chip label={`Win ${pct(stats.winRate, 0)}`} color={stats.winRate >= 0.5 ? colors.green : colors.gold} />
              </View>
              <View style={{ marginTop: 8 }}>
                <EquityChart data={stats.equity} height={64} mini />
              </View>
              <View style={st.perfRow}>
                <Mini label="Trade" value={String(stats.count)} />
                <Mini label="Menang" value={String(stats.wins)} color={colors.green} />
                <Mini label="Kalah" value={String(stats.losses)} color={colors.red} />
              </View>
            </>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconBadge name="create" />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={st.cardTitle}>Mulai catat trade</Text>
                <Text style={st.cardSub}>Statistik win rate & kurva equity muncul otomatis</Text>
              </View>
              <Ionicons name="add-circle" size={28} color={colors.gold} />
            </View>
          )}
        </Card>
      </FadeIn>

      {/* modul */}
      <FadeIn delay={480}>
        <SectionTitle action="Semua" onAction={() => nav.go('edu')}>
          Modul Belajar
        </SectionTitle>
      </FadeIn>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -18 }}
        contentContainerStyle={{ paddingHorizontal: 18, gap: 12 }}
        snapToInterval={232}
        decelerationRate="fast"
      >
        {MODULES.map((m, i) => {
          const d = m.lessons.filter((l) => completed[l.id]).length;
          return (
            <FadeIn key={m.id} delay={520 + i * 80} from="right">
              <PressScale onPress={() => nav.go('edu', { name: 'module', params: { moduleId: m.id } })} style={st.module}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IconBadge name={m.icon} size={20} box={42} />
                  <Chip label={m.level} color={m.level === 'Pemula' ? colors.green : colors.gold} />
                </View>
                <Text style={st.moduleTitle} numberOfLines={2}>
                  {m.title}
                </Text>
                <Text style={st.moduleSub}>{m.lessons.length} materi</Text>
                <View style={{ marginTop: 12 }}>
                  <AnimatedBar value={d / m.lessons.length} height={5} delay={700 + i * 80} />
                </View>
              </PressScale>
            </FadeIn>
          );
        })}
      </ScrollView>

      {/* tip */}
      <FadeIn delay={600}>
        <View style={st.tip}>
          <Text style={st.tipQuote}>“</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.tipLabel}>PRINSIP HARI INI</Text>
            <Text style={st.tipText}>{tip}</Text>
          </View>
        </View>
        <Text style={st.disclaimer}>
          Materi & alat di aplikasi ini untuk edukasi, bukan saran investasi. Trading forex berisiko tinggi.
        </Text>
      </FadeIn>
      <Sheet visible={nameOpen} onClose={() => setNameOpen(false)} title="Nama panggilan">
        <Text style={st.sheetHint}>Nama ini dipakai untuk menyapamu di Beranda.</Text>
        <TextInput
          value={nameDraft}
          onChangeText={setNameDraft}
          placeholder="mis. Budi"
          placeholderTextColor={colors.muted}
          maxLength={20}
          autoCapitalize="words"
          selectionColor={colors.gold}
          style={st.nameInput}
        />
        <GoldButton
          title="Simpan"
          icon="checkmark"
          onPress={() => {
            updateSettings({ name: nameDraft.trim() || undefined });
            setNameOpen(false);
          }}
          style={{ marginTop: 14 }}
        />
      </Sheet>
    </ScrollView>
  );
}

function VipBadge() {
  return (
    <LinearGradient colors={goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.vip}>
      <Ionicons name="diamond" size={11} color={colors.ink} />
      <Text style={st.vipText}>VIP</Text>
    </LinearGradient>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={st.miniLabel}>{label}</Text>
      <Text style={[st.miniValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  brand: { color: colors.text, fontFamily: fonts.display, fontSize: 16, letterSpacing: 2 },
  brandSub: { color: colors.gold, fontFamily: fonts.semi, fontSize: 11, letterSpacing: 0.5 },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dateText: { color: colors.text, fontFamily: fonts.semi, fontSize: 12 },
  hello: { color: colors.textDim, fontFamily: fonts.medium, fontSize: 16 },
  helloBig: { color: colors.text, fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.8, flexShrink: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  vip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  vipText: { color: colors.ink, fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.5 },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 18 },
  achRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  achText: { color: colors.textDim, fontFamily: fonts.semi, fontSize: 13 },
  sheetHint: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, marginBottom: 12, marginTop: -6 },
  nameInput: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 17,
    paddingHorizontal: 16,
    outlineWidth: 0,
  },
  day: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, flexShrink: 1, marginRight: 8 },
  hero: {
    borderRadius: 26,
    padding: 20,
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  heroDeco: { position: 'absolute', right: -40, top: -30 },
  heroEyebrow: { color: 'rgba(22,17,10,0.6)', fontFamily: fonts.bold, fontSize: 11, letterSpacing: 2 },
  ringText: { color: colors.ink, fontFamily: fonts.display, fontSize: 18 },
  heroTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.4 },
  heroSub: { color: 'rgba(22,17,10,0.8)', fontFamily: fonts.semi, fontSize: 14, marginTop: 2 },
  heroMeta: { color: 'rgba(22,17,10,0.55)', fontFamily: fonts.medium, fontSize: 12, marginTop: 6 },
  heroBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroBtnText: { color: colors.goldLight, fontFamily: fonts.bold, fontSize: 15 },
  tool: {
    width: 104,
    height: 112,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    justifyContent: 'space-between',
  },
  toolText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13 },
  perfLabel: { color: colors.muted, fontFamily: fonts.semi, fontSize: 12 },
  perfValue: { fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.6, marginTop: 2 },
  perfRow: { flexDirection: 'row', marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  miniLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11 },
  miniValue: { color: colors.text, fontFamily: fonts.display, fontSize: 18, marginTop: 2 },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  cardSub: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 3 },
  module: {
    width: 220,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  moduleTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 17, marginTop: 14, letterSpacing: -0.3, minHeight: 44 },
  moduleSub: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, marginTop: 4 },
  tip: {
    flexDirection: 'row',
    marginTop: 26,
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(237,193,58,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(237,193,58,0.18)',
  },
  tipQuote: { color: colors.gold, fontFamily: fonts.display, fontSize: 48, lineHeight: 50, marginRight: 10, marginTop: -4 },
  tipLabel: { color: colors.gold, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.8 },
  tipText: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 23, marginTop: 6 },
  disclaimer: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 12,
  },
});
