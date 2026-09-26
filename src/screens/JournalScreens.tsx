import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { EquityChart } from '../components/EquityChart';
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
} from '../components/ui';
import { profitLoss } from '../lib/calc';
import { fmt, fmtDate, parseNum, pct, signedUsd, todayIso, usd } from '../lib/format';
import { findInstrument } from '../lib/instruments';
import { computeStats, Trade, useStore } from '../lib/store';
import { useNav } from '../nav';
import { colors, fonts } from '../theme';

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
  const { trades } = useStore();
  const [period, setPeriod] = useState<Period>('all');
  const list = useMemo(() => trades.filter((t) => inPeriod(t, period)), [trades, period]);
  const s = useMemo(() => computeStats(list), [list]);

  return (
    <Screen
      title="Jurnal Trading"
      eyebrow="PERFORMA"
      subtitle="Tersimpan aman di HP kamu"
      right={
        <PressScale onPress={() => nav.push({ name: 'tradeForm', params: {} })} style={st.addBtn} accessibilityLabel="Tambah trade">
          <Ionicons name="add" size={24} color={colors.ink} />
        </PressScale>
      }
    >
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
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <Ionicons name="book-outline" size={34} color={colors.gold} />
            <Text style={st.emptyTitle}>Belum ada catatan</Text>
            <Text style={st.emptySub}>Catat setiap trade untuk melihat statistik performa kamu.</Text>
            <GoldButton
              title="Tambah trade"
              icon="add"
              style={{ marginTop: 16, alignSelf: 'stretch' }}
              onPress={() => nav.push({ name: 'tradeForm', params: {} })}
            />
          </View>
        </Card>
      ) : (
        list.map((t, i) => (
          <FadeIn key={t.id} delay={200 + Math.min(i, 10) * 50} from="right">
            <TradeRow t={t} onPress={() => nav.push({ name: 'tradeForm', params: { tradeId: t.id } })} />
          </FadeIn>
        ))
      )}
    </Screen>
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

const EMOTIONS = ['Tenang', 'Yakin', 'Ragu', 'Takut', 'Serakah', 'Balas dendam'];

export function TradeFormScreen({ tradeId }: { tradeId?: string }) {
  const nav = useNav();
  const { trades, saveTrade, deleteTrade, settings } = useStore();
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

  const remove = () => {
    if (!existing) return;
    const doIt = () => {
      deleteTrade(existing.id);
      nav.pop();
    };
    if (Platform.OS === 'web') {
      doIt(); // versi web hanya untuk preview
    } else {
      Alert.alert('Hapus trade?', 'Catatan ini akan dihapus permanen.', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: doIt },
      ]);
    }
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
      {existing && <GoldButton title="Hapus trade" icon="trash-outline" variant="danger" onPress={remove} style={{ marginTop: 10 }} />}
    </Screen>
  );
}

const st = StyleSheet.create({
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
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
