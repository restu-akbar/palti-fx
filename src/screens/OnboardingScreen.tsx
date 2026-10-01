import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '../components/Logo';
import { FadeIn, PressScale, tap } from '../components/motion';
import { colors, fonts, goldGradient } from '../theme';

const native = Platform.OS !== 'web';
const { width: SW } = Dimensions.get('window');

/* ─── Ilustrasi Showcase Card (Elegan, Bersih dengan Sentuhan Aksen Emas Halus) ─── */

function IlluLearn() {
  return (
    <View style={illuSt.cardInner}>
      {/* Header card bersih */}
      <View style={illuSt.cardHead}>
        <Text style={illuSt.headTitle}>KURIKULUM TRADING</Text>
      </View>

      {/* Daftar Modul Terbuka */}
      <View style={illuSt.itemList}>
        {/* Item 1: Selesai */}
        <View style={illuSt.itemRow}>
          <View style={illuSt.itemIconWrap}>
            <Ionicons name="checkmark-sharp" size={12} color="rgba(255,255,255,0.7)" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={illuSt.itemTitle}>Dasar Pasar & Istilah Forex</Text>
            <Text style={illuSt.itemSub}>Pips, leverage, spread & mata uang utama</Text>
          </View>
          <Text style={illuSt.statusMuted}>Selesai</Text>
        </View>

        {/* Item 2: Sedang Dipelajari dengan aksen emas lembut */}
        <View style={illuSt.itemRowActive}>
          <View style={illuSt.itemRow}>
            <View style={[illuSt.itemIconWrap, { backgroundColor: 'rgba(237,193,58,0.14)' }]}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.gold }} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[illuSt.itemTitle, { color: '#FFFFFF', fontFamily: fonts.semi }]}>
                  Manajemen Risiko & Lot
                </Text>
                <Text style={{ color: colors.gold, fontFamily: fonts.bold, fontSize: 11.5 }}>65%</Text>
              </View>
              <View style={illuSt.progTrack}>
                <View style={illuSt.progFill} />
              </View>
            </View>
          </View>
        </View>

        {/* Item 3: Lanjutan */}
        <View style={illuSt.itemRow}>
          <View style={illuSt.itemIconWrap}>
            <Ionicons name="lock-closed-outline" size={11} color="rgba(255,255,255,0.4)" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[illuSt.itemTitle, { color: 'rgba(255,255,255,0.5)' }]}>Psikologi & Jurnal Trading</Text>
            <Text style={illuSt.itemSub}>Disiplin emosi & evaluasi trading berkala</Text>
          </View>
          <Text style={illuSt.statusMuted}>Modul 3</Text>
        </View>
      </View>
    </View>
  );
}

function IlluCalc() {
  return (
    <View style={illuSt.cardInner}>
      {/* Header card bersih */}
      <View style={illuSt.cardHead}>
        <Text style={illuSt.headTitle}>SIMULATOR RISIKO PRESET</Text>
      </View>

      {/* Grid Parameter Terbuka */}
      <View style={illuSt.openMetricsGrid}>
        <View style={illuSt.openMetricCol}>
          <Text style={illuSt.metricLabel}>Modal Akun</Text>
          <Text style={illuSt.metricValue}>$1.000</Text>
        </View>
        <View style={illuSt.openMetricCol}>
          <Text style={illuSt.metricLabel}>Batas Risiko</Text>
          <Text style={illuSt.metricValue}>1.0% ($10)</Text>
        </View>
        <View style={illuSt.openMetricCol}>
          <Text style={illuSt.metricLabel}>Stop Loss</Text>
          <Text style={illuSt.metricValue}>20 Pips</Text>
        </View>
        <View style={illuSt.openMetricCol}>
          <Text style={illuSt.metricLabel}>Reward Target</Text>
          <Text style={illuSt.metricValue}>40 Pips (1:2)</Text>
        </View>
      </View>

      {/* Hero Display Hasil Bersih dengan Aksen Emas pada Unit Lot */}
      <View style={illuSt.resultHero}>
        <Text style={illuSt.resultLabel}>Rekomendasi Ukuran Lot</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <Text style={illuSt.resultBigValue}>0.05</Text>
          <Text style={illuSt.resultUnit}>Lot</Text>
        </View>
        <Text style={illuSt.resultNote}>Batas risiko maksimum terhitung: $10.00</Text>
      </View>
    </View>
  );
}

function IlluJournal() {
  const bars = [22, 36, 28, 54, 42, 60, 48, 72, 56, 82];
  return (
    <View style={illuSt.cardInner}>
      {/* Header card bersih */}
      <View style={illuSt.cardHead}>
        <Text style={illuSt.headTitle}>RINGKASAN EQUITY</Text>
      </View>

      {/* 3 Metrik Terbuka & Seimbang dengan Aksen Emas pada Net Profit */}
      <View style={illuSt.journalStatsRow}>
        <View style={illuSt.journalStatItem}>
          <Text style={illuSt.journalStatLabel}>Total Trades</Text>
          <Text style={illuSt.journalStatVal}>24 Trade</Text>
        </View>
        <View style={illuSt.journalStatItem}>
          <Text style={illuSt.journalStatLabel}>Profit Factor</Text>
          <Text style={illuSt.journalStatVal}>2.4x</Text>
        </View>
        <View style={illuSt.journalStatItem}>
          <Text style={illuSt.journalStatLabel}>Net Profit</Text>
          <Text style={[illuSt.journalStatVal, { color: colors.gold }]}>+$345.00</Text>
        </View>
      </View>

      {/* Mini Bar Chart Bersih dengan Bar Terakhir Beraksen Emas */}
      <View style={illuSt.chartWrap}>
        <View style={illuSt.chartBars}>
          {bars.map((h, i) => (
            <View
              key={i}
              style={[
                illuSt.bar,
                {
                  height: h,
                  backgroundColor: i === bars.length - 1 ? colors.gold : 'rgba(255,255,255,0.18)',
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/* ─── Data Langkah ───────────────────────────────────────────────────────── */
type StepData = {
  title: string;
  body: string;
  accent: string;
  illu: React.ReactNode;
};

const STEPS: StepData[] = [
  {
    title: 'Belajar Terarah\nTanpa Rumit',
    body: 'Pelajari konsep dasar pasar forex, istilah teknis penting, hingga strategi risiko terukur melalui kurikulum ringkas yang tersusun bertahap.',
    accent: colors.gold,
    illu: <IlluLearn />,
  },
  {
    title: 'Kalkulator Risiko\nPresisi & Praktis',
    body: 'Hitung ukuran lot ideal dan estimasi batasan risiko secara objektif sebelum membuka posisi agar modal akun tetap terlindungi.',
    accent: colors.gold,
    illu: <IlluCalc />,
  },
  {
    title: 'Catat & Evaluasi\nJurnal Trading',
    body: 'Dokumentasikan setiap eksekusi, pantau perkembangan performa equity, dan temukan pola transaksi terbaikmu untuk menjaga konsistensi trading.',
    accent: colors.gold,
    illu: <IlluJournal />,
  },
];

/* ─── Komponen Utama Onboarding ──────────────────────────────────────────── */
export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const slideX = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const cardY = useRef(new Animated.Value(0)).current;
  const isExpandedRef = useRef(false);

  const snapCard = (to: 'expanded' | 'resting') => {
    const toValue = to === 'expanded' ? -100 : 0;
    isExpandedRef.current = to === 'expanded';
    tap('light');
    Animated.spring(cardY, {
      toValue,
      velocity: 0.8,
      tension: 65,
      friction: 10,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        return Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx) * 1.2;
      },
      onPanResponderGrant: () => {
        cardY.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const base = isExpandedRef.current ? -100 : 0;
        let target = base + g.dy;
        // Rubber band clamping
        if (target < -135) {
          target = -135 + (target + 135) * 0.2;
        } else if (target > 25) {
          target = 25 + (target - 25) * 0.2;
        }
        cardY.setValue(target);
      },
      onPanResponderRelease: (_, g) => {
        if (g.vy < -0.35 || (!isExpandedRef.current && g.dy < -30)) {
          snapCard('expanded');
        } else if (g.vy > 0.35 || (isExpandedRef.current && g.dy > 30)) {
          snapCard('resting');
        } else {
          const base = isExpandedRef.current ? -100 : 0;
          const current = base + g.dy;
          if (current < -50) {
            snapCard('expanded');
          } else {
            snapCard('resting');
          }
        }
      },
      onPanResponderTerminate: () => {
        snapCard(isExpandedRef.current ? 'expanded' : 'resting');
      },
    })
  ).current;

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  const animateTo = (nextIndex: number, dir: 'fwd' | 'back') => {
    if (isExpandedRef.current) {
      snapCard('resting');
    }
    const out = dir === 'fwd' ? -SW * 0.45 : SW * 0.45;
    const inn = dir === 'fwd' ? SW * 0.35 : -SW * 0.35;
    Animated.sequence([
      Animated.timing(slideX, {
        toValue: out,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: native,
      }),
      Animated.timing(slideX, {
        toValue: inn,
        duration: 0,
        useNativeDriver: native,
      }),
      Animated.timing(slideX, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: native,
      }),
    ]).start();
    setStep(nextIndex);
  };

  const finish = () => {
    tap('success');
    Animated.timing(fadeOut, {
      toValue: 0,
      duration: 320,
      easing: Easing.in(Easing.quad),
      useNativeDriver: native,
    }).start(onDone);
  };

  const next = () => {
    tap('select');
    if (isLast) finish();
    else animateTo(step + 1, 'fwd');
  };

  const back = () => {
    tap('light');
    if (!isFirst) animateTo(step - 1, 'back');
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, st.root, { opacity: fadeOut }]}>
      {/* Safe area spacer atas */}
      <View style={{ height: insets.top + 8 }} />

      {/* ── Konten Utama ── */}
      <View style={st.contentContainer}>
        <Animated.View style={[st.slideContent, { transform: [{ translateX: slideX }] }]}>
          {/* Area Teks di Tengah dengan Watermark Logo Ekstra Besar di Belakangnya */}
          <Animated.View
            style={[
              st.textSection,
              {
                opacity: cardY.interpolate({
                  inputRange: [-100, 0],
                  outputRange: [0.35, 1],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    translateY: cardY.interpolate({
                      inputRange: [-100, 0],
                      outputRange: [-16, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Watermark Logo Super Besar Tepat di Tengah Background */}
            <View style={st.watermarkWrap} pointerEvents="none">
              <LogoMark size={330} opacity={0.045} />
            </View>

            {/* Judul & Deskripsi Terletak Konsisten Pas di Tengah */}
            <View style={st.textContentWrap}>
              <FadeIn key={`ti${step}`} from="up" delay={40} distance={8}>
                <Text style={st.titleText}>{s.title}</Text>
              </FadeIn>

              <FadeIn key={`bo${step}`} from="up" delay={80} distance={8}>
                <Text style={st.bodyText}>{s.body}</Text>
              </FadeIn>
            </View>
          </Animated.View>

          {/* Card Showcase di Bawah: Natural Glassmorphism dengan Interaktif Slide Up / Down */}
          <Animated.View
            style={[
              st.cardSection,
              {
                transform: [{ translateY: cardY }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <BlurView intensity={Platform.OS === 'ios' ? 45 : 30} tint="dark" style={st.cardOuter}>
              {/* Handle Bar Interaktif di Atas Card */}
              <Pressable
                onPress={() => snapCard(isExpandedRef.current ? 'resting' : 'expanded')}
                hitSlop={12}
                style={st.handleWrap}
                accessibilityRole="button"
                accessibilityLabel={isExpandedRef.current ? 'Tutup detail card' : 'Buka detail card'}
              >
                <View style={st.handleBar} />
              </Pressable>

              {/* Refleksi kaca halus di bagian atas */}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.015)', 'transparent']}
                style={st.cardSheen}
                pointerEvents="none"
              />

              {/* Garis Border Atas Melengkung Halus */}
              <View style={st.cardBorderTopCap} pointerEvents="none" />

              {/* Garis Border Kiri yang Memudar Halus ke Bawah */}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)', 'transparent']}
                locations={[0, 0.2, 0.5, 0.85]}
                style={st.cardBorderLeft}
                pointerEvents="none"
              />

              {/* Garis Border Kanan yang Memudar Halus ke Bawah */}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)', 'transparent']}
                locations={[0, 0.2, 0.5, 0.85]}
                style={st.cardBorderRight}
                pointerEvents="none"
              />

              {s.illu}

              {/* Gradient Fade yang memudarkan & menyarukan bagian bawah card ke background */}
              <LinearGradient
                colors={['rgba(7,9,14,0)', 'rgba(7,9,14,0.35)', 'rgba(7,9,14,0.85)', '#07090E']}
                locations={[0, 0.35, 0.75, 1]}
                style={st.cardBottomFade}
                pointerEvents="none"
              />
            </BlurView>
          </Animated.View>
        </Animated.View>
      </View>

      {/* ── Footer: Progress Dots + Tombol Aksi ── */}
      <View style={[st.footer, { paddingBottom: insets.bottom + 18 }]}>
        {/* Progress Dots Konsisten Elegan */}
        <View style={st.dotsRow}>
          {STEPS.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                st.dot,
                i === step && [st.dotActive, { backgroundColor: s.accent }],
              ]}
            />
          ))}
        </View>

        {/* Action Row: Kiri (Sebelumnya), Tengah (Lewati), Kanan (Lanjut/Mulai) */}
        <View style={st.actionRow}>
          {/* Kolom Kiri: Sebelumnya */}
          <View style={st.actionColLeft}>
            {isFirst ? (
              <View style={st.btnPlaceholder} />
            ) : (
              <Pressable
                onPress={back}
                hitSlop={12}
                style={st.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Langkah sebelumnya"
              >
                <Ionicons name="chevron-back" size={16} color={colors.textDim} />
                <Text style={st.secondaryText}>Sebelumnya</Text>
              </Pressable>
            )}
          </View>

          {/* Kolom Tengah: Lewati (Tepat di tengah-tengah antar button) */}
          <View style={st.actionColCenter}>
            {!isLast ? (
              <Pressable
                onPress={() => {
                  tap('light');
                  setShowSkipModal(true);
                }}
                hitSlop={14}
                style={st.skipBtn}
                accessibilityRole="button"
                accessibilityLabel="Lewati onboarding"
              >
                <Text style={st.skipText}>Lewati</Text>
              </Pressable>
            ) : (
              <View style={st.btnPlaceholder} />
            )}
          </View>

          {/* Kolom Kanan: Lanjut / Mulai */}
          <View style={st.actionColRight}>
            <PressScale
              onPress={next}
              scaleTo={0.95}
              accessibilityLabel={isLast ? 'Mulai sekarang' : 'Langkah selanjutnya'}
            >
              <LinearGradient
                colors={goldGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={st.primaryBtn}
              >
                <Text style={st.primaryText}>{isLast ? 'Mulai' : 'Lanjut'}</Text>
                <Ionicons
                  name={isLast ? 'arrow-forward' : 'chevron-forward'}
                  size={15}
                  color={colors.ink}
                />
              </LinearGradient>
            </PressScale>
          </View>
        </View>
      </View>

      {/* ── Modal Konfirmasi Lewati Onboarding ── */}
      <Modal
        visible={showSkipModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowSkipModal(false)}
      >
        <View style={st.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowSkipModal(false)}
          >
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={st.modalDimmer} />
          </Pressable>

          {/* Card Pop-up Dark Glass: Elegan, Alami & Proporsional */}
          <BlurView
            intensity={Platform.OS === 'ios' ? 25 : 15}
            tint="dark"
            style={st.modalCard}
          >
            {/* Judul & Teks Penjelasan Tipografis Bersih */}
            <Text style={st.modalTitle}>Lewati Pengenalan?</Text>
            <Text style={st.modalDesc}>
              Kamu akan langsung diarahkan ke halaman login akun.
            </Text>

            {/* Tombol Konfirmasi & Batal */}
            <View style={st.modalBtnRow}>
              <Pressable
                onPress={() => {
                  tap('light');
                  setShowSkipModal(false);
                }}
                hitSlop={8}
                style={st.modalCancelBtn}
                accessibilityRole="button"
                accessibilityLabel="Batal lewati"
              >
                <Text style={st.modalCancelText}>Batal</Text>
              </Pressable>

              <View style={{ flex: 1 }}>
                <PressScale
                  onPress={() => {
                    setShowSkipModal(false);
                    finish();
                  }}
                  accessibilityLabel="Konfirmasi lewati ke halaman login"
                >
                  <LinearGradient
                    colors={goldGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={st.modalConfirmBtn}
                  >
                    <Text style={st.modalConfirmText}>Ya, Masuk</Text>
                  </LinearGradient>
                </PressScale>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    </Animated.View>
  );
}

/* ─── Styles Layar & Layout ──────────────────────────────────────────────── */
const st = StyleSheet.create({
  root: {
    backgroundColor: '#07090E',
    zIndex: 50,
    elevation: 50,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  textSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  watermarkWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  textContentWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  titleText: {
    color: colors.gold,
    fontFamily: fonts.display,
    fontSize: 27,
    letterSpacing: -0.6,
    textAlign: 'center',
    lineHeight: 35,
  },
  bodyText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 6,
    marginTop: 8,
  },
  cardSection: {
    width: '100%',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  cardOuter: {
    width: '100%',
    height: 310,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.065)', // Transparan blur elegan & lebih terlihat
    borderWidth: 0, // Border menggunakan gradient khusus agar memudar alami ke bawah tanpa nabrak
    overflow: 'hidden',
    position: 'relative',
  },
  handleWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    zIndex: 10,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  cardBorderTopCap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderBottomWidth: 0,
  },
  cardBorderLeft: {
    position: 'absolute',
    top: 27,
    bottom: 0,
    left: 0,
    width: 1,
  },
  cardBorderRight: {
    position: 'absolute',
    top: 27,
    bottom: 0,
    right: 0,
    width: 1,
  },
  cardSheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 50,
  },
  cardBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 8,
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotActive: {
    width: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionColLeft: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  actionColCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionColRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  btnPlaceholder: {
    height: 46,
    width: 75,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  secondaryText: {
    color: colors.textDim,
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  skipText: {
    color: colors.textDim,
    fontFamily: fonts.semi,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: colors.gold,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryText: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 14.5,
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalDimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 295,
    backgroundColor: 'rgba(12, 16, 24, 0.88)', // Deep smoky dark-glass, tidak milky / keputihan
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)', // Border tipis lembut & alami
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.semi,
    fontSize: 16,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalDesc: {
    color: colors.textDim,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18.5,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: colors.textDim,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  modalConfirmBtn: {
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: colors.ink,
    fontFamily: fonts.semi,
    fontSize: 13,
    letterSpacing: 0.2,
  },
});

/* ─── Styles Ilustrasi Cards (Organik, Elegan, Bebas Kotak Kaku) ─────────── */
const illuSt = StyleSheet.create({
  cardInner: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  cardHead: {
    paddingBottom: 2,
  },
  headTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: fonts.bold,
    fontSize: 12.5,
    letterSpacing: 1.4,
  },
  itemList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  itemIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  itemSub: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  statusMuted: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  progTrack: {
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 6,
    overflow: 'hidden',
  },
  progFill: {
    width: '65%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  openMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
    columnGap: 20,
    paddingVertical: 4,
  },
  openMetricCol: {
    width: '45%',
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  metricValue: {
    color: '#FFFFFF',
    fontFamily: fonts.semi,
    fontSize: 14.5,
    marginTop: 3,
  },
  resultHero: {
    paddingTop: 8,
  },
  resultLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  resultBigValue: {
    color: '#FFFFFF',
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  resultUnit: {
    color: colors.gold,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  resultNote: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  journalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  journalStatItem: {
    flex: 1,
  },
  journalStatLabel: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  journalStatVal: {
    color: colors.text,
    fontFamily: fonts.semi,
    fontSize: 15,
    marginTop: 3,
  },
  chartWrap: {
    height: 72,
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  bar: {
    flex: 1,
    marginHorizontal: 3.5,
    borderRadius: 4,
  },
});
