import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EquityChart } from '../components/EquityChart';
import { StreakCard } from '../components/Streak';
import { computeStreak } from '../lib/achievements';
import { CountUp, FadeIn, PressScale, tap } from '../components/motion';
import {
  Card,
  Field,
  GoldButton,
  InstrumentPicker,
  Label,
  Note,
  Screen,
  Segmented,
  SectionTitle,
  Sheet,
} from '../components/ui';
import { profitLoss } from '../lib/calc';
import { fmt, fmtDate, parseNum, pct, signedUsd, todayIso, usd } from '../lib/format';
import { findInstrument } from '../lib/instruments';
import { computeStats, Trade, useStore } from '../lib/store';
import { useNav } from '../nav';
import { colors, fonts, goldGradient } from '../theme';

const native = Platform.OS !== 'web';

type Period = 'all' | 'month' | 'week';

const inPeriod = (t: Trade, p: Period) => {
  if (p === 'all') return true;
  const d = new Date(t.date + 'T00:00:00');
  const now = new Date();
  if (p === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return d >= weekAgo;
};

export function JournalScreen() {
  const nav = useNav();
  const { trades, deleteTrade } = useStore();
  const [period, setPeriod] = useState<Period>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const list = useMemo(() => trades.filter((t) => inPeriod(t, period)), [trades, period]);
  const s = useMemo(() => computeStats(list), [list]);
  const selected = trades.find((t) => t.id === selectedId) ?? null;
  const streak = useMemo(() => computeStreak(trades), [trades]);
  const addTrade = () => nav.push({ name: 'tradeForm', params: {} });

  return (
    <Screen
      title="Jurnal Trading"
      eyebrow="PERFORMA"
      subtitle="Tersimpan aman di HP kamu"
      bottomPad={200}
      floating={<AddTradeFab onPress={addTrade} />}
    >
      <FadeIn delay={30}>
        <StreakCard streak={streak} />
      </FadeIn>

      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'all', label: 'Semua' },
          { value: 'month', label: 'Bulan ini' },
          { value: 'week', label: '7 hari' },
        ]}
      />

      <FadeIn delay={60}>
        <Card gold>
          <Text style={st.netLabel}>Net profit / loss</Text>
          <CountUp
            value={s.net}
            format={(n) => (s.count ? signedUsd(n) : '$0')}
            style={[st.net, { color: s.net > 0 ? colors.green : s.net < 0 ? colors.red : colors.goldLight }]}
          />
          <View style={{ marginTop: 12 }}>
            <EquityChart data={s.equity} />
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={140}>
        <View style={st.statsGrid}>
          <Stat label="Total trade" value={String(s.count)} />
          <Stat label="Win rate" value={s.count ? pct(s.winRate, 0) : '—'} />
          <Stat label="Menang / Kalah" value={`${s.wins} / ${s.losses}`} />
          <Stat label="Profit factor" value={s.profitFactor == null ? '∞' : s.count ? fmt(s.profitFactor, 2) : '—'} />
          <Stat label="Rata-rata win" value={s.wins ? usd(s.avgWin) : '—'} color={colors.green} />
          <Stat label="Rata-rata loss" value={s.losses ? usd(-s.avgLoss) : '—'} color={colors.red} />
          <Stat label="Profit terbesar" value={s.best > 0 ? usd(s.best) : '—'} />
          <Stat label="Loss terbesar" value={s.worst < 0 ? usd(s.worst) : '—'} />
        </View>
      </FadeIn>

      <SectionTitle>Riwayat</SectionTitle>
      {list.length === 0 ? (
        <Card>
          <View style={{ alignItems: 'center', paddingVertical: 18 }}>
            <Ionicons name="book-outline" size={34} color={colors.gold} />
            <Text style={st.emptyTitle}>Belum ada catatan</Text>
            <Text style={st.emptySub}>Tekan tombol “Catat Trade” di bawah untuk mulai mencatat.</Text>
          </View>
        </Card>
      ) : (
        <>
          <View style={st.lockHint}>
            <Ionicons name="lock-closed" size={12} color={colors.muted} />
            <Text style={st.lockHintText}>Catatan terkunci. Ketuk untuk melihat detail.</Text>
          </View>
          {list.map((t, i) => (
            <FadeIn key={t.id} delay={200 + Math.min(i, 10) * 50} from="right">
              <TradeRow t={t} onPress={() => setSelectedId(t.id)} />
            </FadeIn>
          ))}
        </>
      )}

      <TradeDetailSheet
        trade={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(id) => {
          setSelectedId(null);
          nav.push({ name: 'tradeForm', params: { tradeId: id } });
        }}
        onDelete={(id) => {
          deleteTrade(id);
          setSelectedId(null);
        }}
      />
    </Screen>
  );
}

/** Tombol besar "Catat Trade" yang melayang di atas menu bawah, dengan cahaya berdenyut. */
function AddTradeFab({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: native }),
        Animated.delay(900),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);
  return (
    <View
      pointerEvents="box-none"
      style={[st.fabWrap, { bottom: Math.max(insets.bottom, 12) + 78 }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          st.fabGlow,
          {
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
            transform: [
              { scaleX: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
              { scaleY: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) },
            ],
          },
        ]}
      />
      <PressScale onPress={onPress} accessibilityLabel="Tambah trade" scaleTo={0.95}>
        <LinearGradient colors={goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.fab}>
          <View style={st.fabIcon}>
            <Ionicons name="add" size={26} color={colors.goldLight} />
          </View>
          <View>
            <Text style={st.fabTitle}>Catat Trade</Text>
            <Text style={st.fabSub}>Tulis hasil trading hari ini</Text>
          </View>
        </LinearGradient>
      </PressScale>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={st.stat}>
      <Text style={st.statLabel}>{label}</Text>
      <Text style={[st.statValue, color ? { color } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function TradeRow({ t, onPress }: { t: Trade; onPress: () => void }) {
  const c = t.pl > 0 ? colors.green : t.pl < 0 ? colors.red : colors.textDim;
  return (
    <Card style={{ marginBottom: 8, paddingVertical: 12 }} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[st.dirBadge, { borderColor: t.direction === 'BUY' ? colors.green : colors.red }]}>
          <Text style={[st.dirText, { color: t.direction === 'BUY' ? colors.green : colors.red }]}>{t.direction}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={st.rowTitle}>
            {t.symbol} <Text style={st.rowLot}>· {fmt(t.lot, 2)} lot</Text>
          </Text>
          <Text style={st.rowSub} numberOfLines={1}>
            {fmtDate(t.date)}
            {t.setup ? ` · ${t.setup}` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[st.rowPl, { color: c }]}>{signedUsd(t.pl)}</Text>
          {t.pips != null && isFinite(t.pips) && (
            <Text style={st.rowSub}>
              {t.pips > 0 ? '+' : ''}
              {fmt(t.pips * 10, 0)} pt · {fmt(t.pips, 1)} pips
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

type Step = 'view' | 'confirmEdit' | 'confirmDelete';

/**
 * Detail trade (hanya baca). Mengedit/menghapus butuh 2 langkah:
 * tekan Edit/Hapus → konfirmasi → baru bisa diubah.
 */
function TradeDetailSheet({
  trade,
  onClose,
  onEdit,
  onDelete,
}: {
  trade: Trade | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [step, setStep] = useState<Step>('view');
  const [last, setLast] = useState<Trade | null>(trade);
  useEffect(() => {
    if (trade) {
      setLast(trade);
      setStep('view');
    }
  }, [trade]);
  const t = trade ?? last; // tetap tampilkan isi saat animasi menutup
  if (!t) return null;
  const plColor = t.pl > 0 ? colors.green : t.pl < 0 ? colors.red : colors.text;
  const num = (n?: number) => (n == null || !isFinite(n) ? '—' : String(n));

  return (
    <Sheet visible={!!trade} onClose={onClose} title={step === 'view' ? `${t.symbol} · ${t.direction}` : ' '}>
      {step === 'view' && (
        <FadeIn from="none" duration={220}>
          <View style={st.detailHead}>
            <View>
              <Text style={st.detailLabel}>Hasil</Text>
              <Text style={[st.detailPl, { color: plColor }]}>{signedUsd(t.pl)}</Text>
            </View>
            <View style={st.lockBadge}>
              <Ionicons name="lock-closed" size={12} color={colors.gold} />
              <Text style={st.lockBadgeText}>Terkunci</Text>
            </View>
          </View>
          <View>
            <View style={st.detailGrid}>
              <Detail label="Tanggal" value={fmtDate(t.date)} />
              <Detail label="Lot" value={fmt(t.lot, 2)} />
              <Detail label="Entry" value={num(t.entry)} />
              <Detail label="Exit" value={num(t.exit)} />
              <Detail label="Stop loss" value={num(t.sl)} />
              <Detail label="Take profit" value={num(t.tp)} />
              {t.pips != null && isFinite(t.pips) && (
                <Detail label="Pergerakan" value={`${fmt(t.pips * 10, 0)} pt · ${fmt(t.pips, 1)} pips`} />
              )}
              {t.emotion ? <Detail label="Emosi" value={t.emotion} /> : null}
            </View>
            {t.setup ? <Detail label="Setup" value={t.setup} wide /> : null}
            {t.notes ? <Detail label="Catatan" value={t.notes} wide /> : null}
          </View>
          <View style={st.actions}>
            <GoldButton
              title="Hapus"
              icon="trash-outline"
              variant="danger"
              style={{ flex: 1 }}
              onPress={() => setStep('confirmDelete')}
            />
            <GoldButton
              title="Edit"
              icon="create-outline"
              variant="outline"
              style={{ flex: 1.4 }}
              onPress={() => setStep('confirmEdit')}
            />
          </View>
        </FadeIn>
      )}

      {step !== 'view' && (
        <FadeIn from="scale" duration={260}>
          <View style={{ alignItems: 'center', paddingTop: 4 }}>
            <View style={[st.confirmIcon, step === 'confirmDelete' && { backgroundColor: colors.red + '22' }]}>
              <Ionicons
                name={step === 'confirmEdit' ? 'create' : 'trash'}
                size={28}
                color={step === 'confirmEdit' ? colors.gold : colors.red}
              />
            </View>
            <Text style={st.confirmTitle}>
              {step === 'confirmEdit' ? 'Yakin mau mengubah catatan ini?' : 'Hapus catatan ini?'}
            </Text>
            <Text style={st.confirmText}>
              {step === 'confirmEdit'
                ? `${t.symbol} ${t.direction} · ${fmtDate(t.date)} · ${signedUsd(t.pl)}\n\nJurnal yang jujur adalah kunci evaluasi. Ubah hanya untuk memperbaiki salah input.`
                : `${t.symbol} ${t.direction} · ${fmtDate(t.date)} · ${signedUsd(t.pl)}\n\nCatatan yang dihapus tidak bisa dikembalikan.`}
            </Text>
          </View>
          <View style={st.actions}>
            <GoldButton title="Batal" variant="outline" style={{ flex: 1 }} onPress={() => setStep('view')} />
            {step === 'confirmEdit' ? (
              <GoldButton title="Ya, edit" icon="create-outline" style={{ flex: 1.4 }} onPress={() => onEdit(t.id)} />
            ) : (
              <GoldButton
                title="Ya, hapus"
                icon="trash"
                variant="danger"
                style={{ flex: 1.4 }}
                onPress={() => {
                  tap('success');
                  onDelete(t.id);
                }}
              />
            )}
          </View>
        </FadeIn>
      )}
    </Sheet>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[st.detail, wide && { width: '100%', marginTop: 10 }]}>
      <Text style={st.detailLabel}>{label}</Text>
      <Text style={st.detailValue} numberOfLines={wide ? 4 : 1}>
        {value}
      </Text>
    </View>
  );
}

const EMOTIONS = ['Tenang', 'Yakin', 'Ragu', 'Takut', 'Serakah', 'Balas dendam'];

export function TradeFormScreen({ tradeId }: { tradeId?: string }) {
  const nav = useNav();
  const { trades, saveTrade, settings } = useStore();
  const existing = tradeId ? trades.find((t) => t.id === tradeId) : undefined;
  const str = (n?: number) => (n == null || !isFinite(n) ? '' : String(n));

  const [date, setDate] = useState(existing?.date ?? todayIso());
  const [symbol, setSymbol] = useState(existing?.symbol ?? settings.lastSymbol ?? 'XAUUSD');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>(existing?.direction ?? 'BUY');
  const [lot, setLot] = useState(str(existing?.lot));
  const [entry, setEntry] = useState(str(existing?.entry));
  const [exit, setExit] = useState(str(existing?.exit));
  const [sl, setSl] = useState(str(existing?.sl));
  const [tp, setTp] = useState(str(existing?.tp));
  const [pl, setPl] = useState(str(existing?.pl));
  const [setup, setSetup] = useState(existing?.setup ?? '');
  const [emotion, setEmotion] = useState(existing?.emotion ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [error, setError] = useState('');

  const inst = findInstrument(symbol);
  const auto = profitLoss({
    inst,
    rates: {},
    direction,
    lot: parseNum(lot),
    open: parseNum(entry),
    close: parseNum(exit),
  });

  const save = () => {
    const lotN = parseNum(lot);
    let plN = parseNum(pl);
    if (!isFinite(plN) && auto?.usd != null) plN = Math.round(auto.usd * 100) / 100;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Format tanggal harus TTTT-BB-HH, contoh 2026-09-23.');
    if (!isFinite(lotN) || lotN <= 0) return setError('Isi ukuran lot.');
    if (!isFinite(plN)) return setError('Isi hasil P/L dalam USD (gunakan tanda minus untuk loss).');
    const num = (s: string) => (isFinite(parseNum(s)) ? parseNum(s) : undefined);
    saveTrade({
      id: existing?.id,
      createdAt: existing?.createdAt,
      date,
      symbol,
      direction,
      lot: lotN,
      entry: num(entry),
      exit: num(exit),
      sl: num(sl),
      tp: num(tp),
      pl: plN,
      pips: auto?.pips,
      setup: setup.trim() || undefined,
      emotion: emotion || undefined,
      notes: notes.trim() || undefined,
    });
    tap('success');
    nav.pop();
  };

  return (
    <Screen title={existing ? 'Edit Trade' : 'Catat Trade'} subtitle="Semua data disimpan di perangkat ini">
      <Field label="Tanggal" value={date} onChangeText={setDate} keyboard="numbers-and-punctuation" placeholder="2026-09-23" />
      <InstrumentPicker value={symbol} onChange={setSymbol} />
      <Segmented
        label="Arah"
        value={direction}
        onChange={setDirection}
        options={[
          { value: 'BUY', label: 'BUY', color: colors.green },
          { value: 'SELL', label: 'SELL', color: colors.red },
        ]}
      />
      <Field label="Ukuran lot" value={lot} onChangeText={setLot} suffix="lot" placeholder="0.10" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Entry" value={entry} onChangeText={setEntry} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Exit" value={exit} onChangeText={setExit} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Stop loss" value={sl} onChangeText={setSl} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Take profit" value={tp} onChangeText={setTp} />
        </View>
      </View>
      <Field
        label="Hasil P/L bersih"
        value={pl}
        onChangeText={setPl}
        suffix="USD"
        keyboard="numbers-and-punctuation"
        placeholder={auto?.usd != null ? `otomatis: ${fmt(auto.usd, 2)}` : 'contoh: 25 atau -12.5'}
        hint={
          auto
            ? `Perkiraan dari harga: ${auto.pips > 0 ? '+' : ''}${fmt(auto.pips * 10, 0)} point (${fmt(auto.pips, 1)} pips)${
                auto.usd != null ? ` ≈ ${signedUsd(auto.usd)}` : ''
              }. Kosongkan untuk memakai perkiraan, atau isi sesuai hasil di broker.`
            : 'Isi sesuai hasil di broker (sudah termasuk komisi & swap).'
        }
      />
      <Field label="Setup / strategi" value={setup} onChangeText={setSetup} keyboard="default" placeholder="mis. Breakout, Supply-Demand" />
      <Label>Emosi saat entry</Label>
      <View style={st.chips}>
        {EMOTIONS.map((e) => {
          const active = emotion === e;
          return (
            <PressScale key={e} onPress={() => setEmotion(active ? '' : e)} style={[st.chip, active && st.chipActive]}>
              <Text style={[st.chipText, active && { color: colors.ink }]}>{e}</Text>
            </PressScale>
          );
        })}
      </View>
      <Field label="Catatan & pelajaran" value={notes} onChangeText={setNotes} keyboard="default" multiline placeholder="Apa yang berjalan baik? Apa yang perlu diperbaiki?" />

      {error ? <Note icon="alert-circle-outline">{error}</Note> : null}
      <GoldButton title={existing ? 'Simpan perubahan' : 'Simpan trade'} icon="checkmark" onPress={save} style={{ marginTop: 16 }} />
    </Screen>
  );
}

const st = StyleSheet.create({
  fabWrap: { position: 'absolute', left: 18, right: 18, alignItems: 'stretch' },
  fabGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 22,
    backgroundColor: colors.gold,
  },
  fab: {
    height: 64,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fabIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  fabTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.3 },
  fabSub: { color: 'rgba(22,17,10,0.65)', fontFamily: fonts.semi, fontSize: 12, marginTop: 1 },
  lockHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4, marginBottom: 10 },
  lockHintText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12 },
  detailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  detailPl: { fontFamily: fonts.display, fontSize: 32, letterSpacing: -0.8, marginTop: 2 },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: 'rgba(237,193,58,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lockBadgeText: { color: colors.gold, fontFamily: fonts.bold, fontSize: 11 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  detail: { width: '50%' },
  detailLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12 },
  detailValue: { color: colors.text, fontFamily: fonts.semi, fontSize: 15, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20, flexShrink: 0 },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(237,193,58,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 20, textAlign: 'center', letterSpacing: -0.3 },
  confirmText: {
    color: colors.textDim,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  netLabel: { color: colors.textDim, fontFamily: fonts.semi, fontSize: 13 },
  net: { fontFamily: fonts.display, fontSize: 36, marginTop: 4, letterSpacing: -1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  statLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  statValue: { color: colors.text, fontFamily: fonts.display, fontSize: 18, marginTop: 4 },
  emptyTitle: { color: colors.text, fontFamily: fonts.displaySemi, fontSize: 18, marginTop: 10 },
  emptySub: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 4 },
  dirBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 48, alignItems: 'center' },
  dirText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.5 },
  rowTitle: { color: colors.text, fontFamily: fonts.semi, fontSize: 15 },
  rowLot: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  rowSub: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  rowPl: { fontFamily: fonts.semi, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.gold, backgroundColor: colors.gold },
  chipText: { color: colors.textDim, fontFamily: fonts.medium, fontSize: 13 },
});
