import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CountUp, FadeIn, PressScale } from '../components/motion';
import {
  Card,
  Field,
  IconBadge,
  IconName,
  InstrumentPicker,
  Note,
  ResultRow,
  Screen,
  SectionTitle,
  Segmented,
} from '../components/ui';
import {
  compounding,
  lotSize,
  margin,
  pipValuePerLot,
  priceDiffToPips,
  profitLoss,
  Rates,
  requiredPairs,
  riskReward,
} from '../lib/calc';
import { fmt, parseNum, pct, signedUsd, usd } from '../lib/format';
import { findInstrument, Instrument, POINTS_PER_PIP } from '../lib/instruments';
import { useStore } from '../lib/store';
import { ToolId, useNav } from '../nav';
import { colors, fonts, goldGradient } from '../theme';

export const TOOLS: { id: ToolId; title: string; desc: string; icon: IconName }[] = [
  { id: 'lot', title: 'Lot Size', desc: 'Hitung lot sesuai risiko & stop loss', icon: 'layers' },
  { id: 'rr', title: 'Risk Reward', desc: 'Rasio R:R & win rate minimal', icon: 'git-compare' },
  { id: 'pip', title: 'Nilai Pip', desc: 'Nilai point & pip per lot', icon: 'pricetag' },
  { id: 'margin', title: 'Margin', desc: 'Margin yang dibutuhkan', icon: 'wallet' },
  { id: 'pl', title: 'Profit Loss', desc: 'Hasil dari harga open & close', icon: 'cash' },
  { id: 'compound', title: 'Compounding', desc: 'Simulasi pertumbuhan modal', icon: 'trending-up' },
];

export function ToolsScreen() {
  const nav = useNav();
  return (
    <Screen title="Kalkulator" eyebrow="ALAT TRADING" subtitle="Hitung cepat sebelum entry">
      <FadeIn delay={40}>
        <ConversionStrip />
      </FadeIn>
      <View style={st.grid}>
        {TOOLS.map((t, i) => (
          <FadeIn key={t.id} delay={100 + i * 70} from="scale" style={st.gridItem}>
            <PressScale onPress={() => nav.push({ name: 'tool', params: { toolId: t.id } })}>
              {i === 0 ? (
                <LinearGradient colors={goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.tile}>
                  <View style={[st.tileIcon, { backgroundColor: 'rgba(22,17,10,0.12)' }]}>
                    <Ionicons name={t.icon} size={22} color={colors.ink} />
                  </View>
                  <View>
                    <Text style={[st.tileTitle, { color: colors.ink }]}>{t.title}</Text>
                    <Text style={[st.tileDesc, { color: 'rgba(22,17,10,0.65)' }]}>{t.desc}</Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={[st.tile, st.tileDark]}>
                  <IconBadge name={t.icon} size={22} box={44} />
                  <View>
                    <Text style={st.tileTitle}>{t.title}</Text>
                    <Text style={st.tileDesc}>{t.desc}</Text>
                  </View>
                </View>
              )}
            </PressScale>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}

/** Pengingat konversi ala PALTI FX. */
function ConversionStrip() {
  return (
    <View style={st.strip}>
      <StripItem big="100" small="point" />
      <Text style={st.stripEq}>=</Text>
      <StripItem big="10" small="pips" />
      <Text style={st.stripEq}>=</Text>
      <StripItem big="$1" small="lot 0,01" gold />
    </View>
  );
}

function StripItem({ big, small, gold }: { big: string; small: string; gold?: boolean }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[st.stripBig, gold && { color: colors.goldLight }]}>{big}</Text>
      <Text style={st.stripSmall}>{small}</Text>
    </View>
  );
}

export function ToolScreen({ toolId }: { toolId: ToolId }) {
  const t = TOOLS.find((x) => x.id === toolId)!;
  const body = {
    lot: <LotSizeTool />,
    rr: <RiskRewardTool />,
    pip: <PipValueTool />,
    margin: <MarginTool />,
    pl: <ProfitLossTool />,
    compound: <CompoundTool />,
  }[toolId];
  return (
    <Screen title={t.title} eyebrow="KALKULATOR" subtitle={t.desc}>
      <FadeIn delay={60}>{body}</FadeIn>
    </Screen>
  );
}

/* ---------- helper ---------- */

function useSymbol() {
  const { settings, updateSettings } = useStore();
  const [symbol, setSymbolState] = useState(settings.lastSymbol ?? 'XAUUSD');
  const setSymbol = (s: string) => {
    setSymbolState(s);
    updateSettings({ lastSymbol: s });
  };
  return [symbol, setSymbol, findInstrument(symbol)] as const;
}

/** Input harga untuk pasangan konversi yang dibutuhkan. */
function useRates(inst: Instrument, which: ('quote' | 'base')[], ownPrice?: number) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const pairs = requiredPairs(inst, which).filter((p) => !(p === inst.symbol && ownPrice != null));
  const rates: Rates = {};
  for (const p of pairs) rates[p] = parseNum(vals[p] ?? '');
  if (ownPrice != null) rates[inst.symbol] = ownPrice;
  const node = pairs.length ? (
    <View>
      {pairs.map((p) => (
        <Field
          key={p}
          label={p === inst.symbol ? `Harga ${p} saat ini` : `Harga ${p} saat ini (konversi ke USD)`}
          value={vals[p] ?? ''}
          onChangeText={(t) => setVals((v) => ({ ...v, [p]: t }))}
          placeholder={placeholderFor(p)}
        />
      ))}
    </View>
  ) : null;
  return { rates, node };
}

const placeholderFor = (pair: string) => {
  if (pair.endsWith('JPY')) return 'mis. 150.250';
  if (pair.startsWith('XAU')) return 'mis. 2350.50';
  if (pair.startsWith('XAG')) return 'mis. 28.500';
  return 'mis. 1.08500';
};

const pipsToPoints = (p: number) => p * POINTS_PER_PIP;

/** Kartu hasil utama dengan angka besar yang teranimasi. */
function Result({
  label,
  value,
  format,
  color,
  caption,
  children,
  empty,
}: {
  label: string;
  value: number | null | undefined;
  format: (n: number) => string;
  color?: string;
  caption?: string;
  children?: React.ReactNode;
  empty?: string;
}) {
  const ok = value != null && isFinite(value);
  return (
    <View style={{ marginTop: 8 }}>
      <SectionTitle>Hasil</SectionTitle>
      <Card gold padded={false}>
        <LinearGradient
          colors={['rgba(237,193,58,0.16)', 'rgba(237,193,58,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ padding: 18, paddingBottom: ok ? 8 : 18 }}
        >
          <Text style={st.resLabel}>{label}</Text>
          {ok ? (
            <CountUp value={value!} format={format} style={[st.resValue, color ? { color } : null]} duration={600} />
          ) : (
            <Text style={st.empty}>{empty ?? 'Lengkapi data di atas untuk melihat hasil.'}</Text>
          )}
          {ok && caption ? <Text style={st.resCaption}>{caption}</Text> : null}
        </LinearGradient>
        {ok && children ? <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>{children}</View> : null}
      </Card>
    </View>
  );
}

/** Baris "100 point = 10 pips = $x" untuk lot tertentu. */
function PointLine({ pipValue, lot = 0.01 }: { pipValue: number; lot?: number }) {
  return (
    <ResultRow
      label={`100 point = 10 pips`}
      sub={`pada ${fmt(lot, 2)} lot`}
      value={usd(pipValue * lot * 10)}
      color={colors.goldLight}
    />
  );
}

/* ---------- Lot Size ---------- */

type SlUnit = 'points' | 'pips' | 'price';

function LotSizeTool() {
  const { settings, updateSettings } = useStore();
  useEffect(() => {
    updateSettings({ lotCalcCount: (settings.lotCalcCount ?? 0) + 1 });
    // hanya sekali saat kalkulator dibuka
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [symbol, setSymbol, inst] = useSymbol();
  const [balance, setBalance] = useState(settings.balance ?? '');
  const [riskMode, setRiskMode] = useState<'pct' | 'usd'>('pct');
  const [risk, setRisk] = useState(settings.riskPercent ?? '1');
  const [riskUsd, setRiskUsd] = useState('');
  const [slMode, setSlMode] = useState<SlUnit>('points');
  const [sl, setSl] = useState('');
  const [entry, setEntry] = useState('');
  const [slPrice, setSlPrice] = useState('');

  useEffect(() => {
    updateSettings({ balance, riskPercent: risk });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, risk]);

  const entryNum = slMode === 'price' ? parseNum(entry) : undefined;
  const { rates, node } = useRates(inst, ['quote'], entryNum != null && isFinite(entryNum) ? entryNum : undefined);
  const slPips =
    slMode === 'pips'
      ? parseNum(sl)
      : slMode === 'points'
        ? parseNum(sl) / POINTS_PER_PIP
        : priceDiffToPips(inst, parseNum(entry), parseNum(slPrice));

  const res = lotSize({
    inst,
    rates,
    balance: parseNum(balance),
    riskPercent: riskMode === 'pct' ? parseNum(risk) : undefined,
    riskAmount: riskMode === 'usd' ? parseNum(riskUsd) : undefined,
    slPips,
  });

  return (
    <View>
      <InstrumentPicker value={symbol} onChange={setSymbol} />
      <Field label="Modal / Balance" value={balance} onChangeText={setBalance} suffix="USD" placeholder="1000" />
      <Segmented
        label="Risiko per trade"
        value={riskMode}
        onChange={setRiskMode}
        options={[
          { value: 'pct', label: 'Persen %' },
          { value: 'usd', label: 'Nominal $' },
        ]}
      />
      {riskMode === 'pct' ? (
        <Field label="Risiko" value={risk} onChangeText={setRisk} suffix="%" placeholder="1" />
      ) : (
        <Field label="Risiko" value={riskUsd} onChangeText={setRiskUsd} suffix="USD" placeholder="10" />
      )}
      <Segmented
        label="Stop loss dalam"
        value={slMode}
        onChange={setSlMode}
        options={[
          { value: 'points', label: 'Point' },
          { value: 'pips', label: 'Pips' },
          { value: 'price', label: 'Harga' },
        ]}
      />
      {slMode !== 'price' ? (
        <Field
          label="Stop loss"
          value={sl}
          onChangeText={setSl}
          suffix={slMode === 'points' ? 'point' : 'pips'}
          placeholder={slMode === 'points' ? '500' : '50'}
          hint={
            isFinite(slPips) && slPips > 0
              ? slMode === 'points'
                ? `= ${fmt(slPips, 1)} pips`
                : `= ${fmt(pipsToPoints(slPips), 0)} point`
              : '10 point = 1 pip'
          }
        />
      ) : (
        <>
          <Field label="Harga entry" value={entry} onChangeText={setEntry} placeholder={placeholderFor(symbol)} />
          <Field label="Harga stop loss" value={slPrice} onChangeText={setSlPrice} placeholder={placeholderFor(symbol)} />
        </>
      )}
      {node}

      <Result
        label="Ukuran lot yang disarankan"
        value={res?.lot}
        format={(n) => `${fmt(n, 2)} lot`}
        caption={res ? `Risiko ${usd(res.riskAmount)} dengan SL ${fmt(pipsToPoints(slPips), 0)} point` : undefined}
      >
        {res && (
          <>
            <ResultRow label="Stop loss" value={`${fmt(pipsToPoints(slPips), 0)} pt · ${fmt(slPips, 1)} pips`} />
            <ResultRow label={`Risiko aktual (${fmt(res.lot, 2)} lot)`} value={usd(res.actualRisk)} color={colors.red} />
            <ResultRow label="Nilai 1 pip per 1 lot" value={usd(res.pipValue)} />
            <PointLine pipValue={res.pipValue} />
            <ResultRow label="Lot tepat sebelum dibulatkan" value={fmt(res.rawLot, 4)} />
          </>
        )}
      </Result>
      {res && res.lot === 0 && (
        <Note icon="warning">
          Risiko terlalu kecil untuk lot minimum 0,01. Perkecil stop loss, tambah modal, atau gunakan akun cent.
        </Note>
      )}
      <Note>Lot dibulatkan ke bawah (kelipatan 0,01) supaya risiko tidak melebihi batas yang kamu tentukan.</Note>
    </View>
  );
}

/* ---------- Pip Value ---------- */

function PipValueTool() {
  const [symbol, setSymbol, inst] = useSymbol();
  const [lot, setLot] = useState('0.01');
  const { rates, node } = useRates(inst, ['quote']);
  const pv = pipValuePerLot(inst, rates);
  const l = parseNum(lot);
  const ok = pv != null && isFinite(l) && l > 0;

  return (
    <View>
      <InstrumentPicker value={symbol} onChange={setSymbol} />
      <Field label="Ukuran lot" value={lot} onChangeText={setLot} suffix="lot" placeholder="0.01" />
      {node}
      <Result
        label={`Nilai 1 pip pada ${ok ? fmt(l, 2) : '…'} lot`}
        value={ok ? pv! * l : null}
        format={(n) => usd(n, n < 1 ? 3 : 2)}
        caption={ok ? `1 point = ${usd((pv! * l) / POINTS_PER_PIP, 4)}` : undefined}
      >
        {ok && (
          <>
            <PointLine pipValue={pv!} lot={l} />
            <ResultRow label="1 lot standar / pip" value={usd(pv)} />
            <ResultRow label="0,1 lot / pip" value={usd(pv! * 0.1)} />
            <ResultRow label="0,01 lot / pip" value={usd(pv! * 0.01, 2)} />
            <ResultRow
              label="Ukuran 1 pip"
              sub={`1 point = ${String(inst.pipSize / POINTS_PER_PIP).replace('.', ',')}`}
              value={String(inst.pipSize).replace('.', ',')}
            />
          </>
        )}
      </Result>
      {inst.base === 'XAU' && (
        <Note>XAUUSD: harga bergerak 1,00 (mis. 2350,00 → 2351,00) = 100 point = 10 pips = $1 pada lot 0,01.</Note>
      )}
    </View>
  );
}

/* ---------- Risk Reward ---------- */

function RiskRewardTool() {
  const [symbol, setSymbol, inst] = useSymbol();
  const [entry, setEntry] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [lot, setLot] = useState('');
  const e = parseNum(entry);
  const { rates, node } = useRates(inst, ['quote'], isFinite(e) ? e : undefined);
  const res = riskReward({ inst, rates, entry: e, sl: parseNum(sl), tp: parseNum(tp), lot: parseNum(lot) });
  const filled = entry && sl && tp;

  return (
    <View>
      <InstrumentPicker value={symbol} onChange={setSymbol} />
      <Field label="Harga entry" value={entry} onChangeText={setEntry} placeholder={placeholderFor(symbol)} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Stop loss" value={sl} onChangeText={setSl} placeholder="harga SL" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Take profit" value={tp} onChangeText={setTp} placeholder="harga TP" />
        </View>
      </View>
      <Field label="Ukuran lot (opsional)" value={lot} onChangeText={setLot} suffix="lot" placeholder="0.10" />
      {lot ? node : null}
      <Result
        label="Rasio Risk : Reward"
        value={res?.ratio}
        format={(n) => `1 : ${fmt(n, 2)}`}
        caption={res ? `Win rate minimal agar impas: ${pct(res.breakevenWinRate)}` : undefined}
        empty={filled ? 'Posisi harga tidak valid. BUY: SL di bawah entry & TP di atas. SELL: sebaliknya.' : undefined}
      >
        {res && (
          <>
            <RRBar sl={res.slPips} tp={res.tpPips} />
            <ResultRow label="Arah posisi" value={res.direction} color={res.direction === 'BUY' ? colors.green : colors.red} />
            <ResultRow label="Stop loss" value={`${fmt(pipsToPoints(res.slPips), 0)} pt · ${fmt(res.slPips, 1)} pips`} />
            <ResultRow label="Take profit" value={`${fmt(pipsToPoints(res.tpPips), 0)} pt · ${fmt(res.tpPips, 1)} pips`} />
            {res.riskUsd != null && <ResultRow label="Potensi rugi" value={usd(res.riskUsd)} color={colors.red} />}
            {res.rewardUsd != null && <ResultRow label="Potensi untung" value={usd(res.rewardUsd)} color={colors.green} />}
          </>
        )}
      </Result>
      <Note>Arah BUY/SELL dideteksi otomatis dari posisi SL dan TP terhadap harga entry.</Note>
    </View>
  );
}

function RRBar({ sl, tp }: { sl: number; tp: number }) {
  const total = sl + tp;
  return (
    <View style={{ marginVertical: 12 }}>
      <View style={st.rrBar}>
        <View style={{ flex: sl / total, backgroundColor: colors.red, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} />
        <View style={{ width: 3, backgroundColor: colors.text }} />
        <View style={{ flex: tp / total, backgroundColor: colors.green, borderTopRightRadius: 6, borderBottomRightRadius: 6 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={[st.rrText, { color: colors.red }]}>Risk</Text>
        <Text style={[st.rrText, { color: colors.muted }]}>Entry</Text>
        <Text style={[st.rrText, { color: colors.green }]}>Reward</Text>
      </View>
    </View>
  );
}

/* ---------- Margin ---------- */

const LEVERAGES = ['100', '200', '500', '1000'];

function MarginTool() {
  const { settings, updateSettings } = useStore();
  const [symbol, setSymbol, inst] = useSymbol();
  const [lot, setLot] = useState('1');
  const [lev, setLev] = useState(settings.leverage ?? '500');
  const [custom, setCustom] = useState(LEVERAGES.includes(settings.leverage ?? '500') ? '' : settings.leverage ?? '');
  const leverage = LEVERAGES.includes(lev) ? parseNum(lev) : parseNum(custom);
  useEffect(() => {
    const v = LEVERAGES.includes(lev) ? lev : custom;
    if (v) updateSettings({ leverage: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lev, custom]);

  const { rates, node } = useRates(inst, ['base']);
  const m = margin({ inst, rates, lot: parseNum(lot), leverage });

  return (
    <View>
      <InstrumentPicker value={symbol} onChange={setSymbol} />
      <Field label="Ukuran lot" value={lot} onChangeText={setLot} suffix="lot" placeholder="1" />
      <Segmented
        label="Leverage"
        value={LEVERAGES.includes(lev) ? lev : 'x'}
        onChange={setLev}
        options={[...LEVERAGES.map((l) => ({ value: l, label: '1:' + l })), { value: 'x', label: 'Lain' }]}
      />
      {!LEVERAGES.includes(lev) && (
        <Field label="Leverage lainnya (1 : ...)" value={custom} onChangeText={setCustom} placeholder="2000" />
      )}
      {node}
      <Result
        label="Margin dibutuhkan"
        value={m}
        format={(n) => usd(n)}
        caption={m != null ? `Nilai posisi ${usd(m * leverage)} · leverage 1:${fmt(leverage, 0)}` : undefined}
      />
      <Note>Beberapa broker memakai leverage berbeda untuk emas, indeks, atau saat berita. Cek ketentuan broker kamu.</Note>
    </View>
  );
}

/* ---------- Profit / Loss ---------- */

function ProfitLossTool() {
  const [symbol, setSymbol, inst] = useSymbol();
  const [dir, setDir] = useState<'BUY' | 'SELL'>('BUY');
  const [lot, setLot] = useState('');
  const [open, setOpen] = useState('');
  const [close, setClose] = useState('');
  const c = parseNum(close);
  const { rates, node } = useRates(inst, ['quote'], isFinite(c) ? c : undefined);
  const res = profitLoss({ inst, rates, direction: dir, lot: parseNum(lot), open: parseNum(open), close: c });
  const val = res?.usd ?? null;

  return (
    <View>
      <InstrumentPicker value={symbol} onChange={setSymbol} />
      <Segmented
        label="Arah"
        value={dir}
        onChange={setDir}
        options={[
          { value: 'BUY', label: 'BUY', color: colors.green },
          { value: 'SELL', label: 'SELL', color: colors.red },
        ]}
      />
      <Field label="Ukuran lot" value={lot} onChangeText={setLot} suffix="lot" placeholder="0.10" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Harga open" value={open} onChangeText={setOpen} placeholder={placeholderFor(symbol)} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Harga close" value={close} onChangeText={setClose} placeholder={placeholderFor(symbol)} />
        </View>
      </View>
      {node}
      <Result
        label={val != null && val < 0 ? 'Loss' : 'Profit'}
        value={val}
        format={(n) => signedUsd(n)}
        color={val != null ? (val > 0 ? colors.green : val < 0 ? colors.red : undefined) : undefined}
        caption={
          res
            ? `${res.pips > 0 ? '+' : ''}${fmt(pipsToPoints(res.pips), 0)} point · ${res.pips > 0 ? '+' : ''}${fmt(res.pips, 1)} pips`
            : undefined
        }
      />
      <Note>Belum termasuk spread, komisi, dan swap dari broker.</Note>
    </View>
  );
}

/* ---------- Compounding ---------- */

function CompoundTool() {
  const [initial, setInitial] = useState('1000');
  const [percent, setPercent] = useState('5');
  const [periods, setPeriods] = useState('12');
  const [add, setAdd] = useState('');
  const [unit, setUnit] = useState<'bulan' | 'minggu' | 'hari'>('bulan');
  const rows = useMemo(
    () =>
      compounding({
        initial: parseNum(initial),
        percent: parseNum(percent),
        periods: parseNum(periods),
        addPerPeriod: parseNum(add),
      }),
    [initial, percent, periods, add],
  );
  const last = rows[rows.length - 1];
  const init = parseNum(initial);
  const addNum = isFinite(parseNum(add)) ? parseNum(add) : 0;
  const totalDeposit = init + addNum * rows.length;
  const maxEnd = rows.reduce((mx, r) => Math.max(mx, r.end), 0);

  return (
    <View>
      <Field label="Modal awal" value={initial} onChangeText={setInitial} suffix="USD" />
      <Segmented
        label="Periode"
        value={unit}
        onChange={setUnit}
        options={[
          { value: 'hari', label: 'Harian' },
          { value: 'minggu', label: 'Mingguan' },
          { value: 'bulan', label: 'Bulanan' },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label={`Profit / ${unit}`} value={percent} onChangeText={setPercent} suffix="%" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={`Jumlah ${unit}`} value={periods} onChangeText={setPeriods} />
        </View>
      </View>
      <Field label={`Tambahan modal per ${unit} (opsional)`} value={add} onChangeText={setAdd} suffix="USD" placeholder="0" />
      <Result
        label="Saldo akhir"
        value={last?.end}
        format={(n) => usd(n)}
        caption={last ? `Profit ${signedUsd(last.end - totalDeposit)} · tumbuh ${pct((last.end - totalDeposit) / totalDeposit, 0)}` : undefined}
      >
        {last && (
          <View style={st.bars}>
            {rows.slice(-24).map((r) => (
              <View key={r.period} style={{ flex: 1, justifyContent: 'flex-end' }}>
                <View style={[st.barCol, { height: `${Math.max(4, (r.end / maxEnd) * 100)}%` }]} />
              </View>
            ))}
          </View>
        )}
      </Result>
      {rows.length > 0 && (
        <Card style={{ marginTop: 12 }} padded={false}>
          <View style={[st.tr, { backgroundColor: 'rgba(237,193,58,0.08)' }]}>
            <Text style={[st.th, { flex: 0.6, textAlign: 'left' }]}>{unit === 'bulan' ? 'Bln' : unit === 'minggu' ? 'Mgg' : 'Hari'}</Text>
            <Text style={st.th}>Awal</Text>
            <Text style={st.th}>Profit</Text>
            <Text style={st.th}>Akhir</Text>
          </View>
          {rows.map((r) => (
            <View key={r.period} style={st.tr}>
              <Text style={[st.td, { flex: 0.6, color: colors.gold, textAlign: 'left' }]}>{r.period}</Text>
              <Text style={st.td}>{fmt(r.start, 0)}</Text>
              <Text style={[st.td, { color: r.profit >= 0 ? colors.green : colors.red }]}>{fmt(r.profit, 0)}</Text>
              <Text style={[st.td, { color: colors.text }]}>{fmt(r.end, 0)}</Text>
            </View>
          ))}
        </Card>
      )}
      <Note icon="warning">
        Simulasi ini hanya ilustrasi matematis. Hasil trading nyata tidak konsisten setiap periode dan bisa mengalami drawdown.
      </Note>
    </View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  gridItem: { width: '47.5%', flexGrow: 1 },
  tile: { height: 150, borderRadius: 24, padding: 16, justifyContent: 'space-between' },
  tileDark: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tileIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 16, letterSpacing: -0.2 },
  tileDesc: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, marginTop: 3, lineHeight: 16 },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  stripBig: { color: colors.text, fontFamily: fonts.display, fontSize: 22 },
  stripSmall: { color: colors.muted, fontFamily: fonts.semi, fontSize: 11, marginTop: 1 },
  stripEq: { color: colors.gold, fontFamily: fonts.display, fontSize: 18 },
  resLabel: { color: colors.textDim, fontFamily: fonts.semi, fontSize: 13 },
  resValue: { color: colors.goldLight, fontFamily: fonts.display, fontSize: 38, letterSpacing: -1, marginTop: 4 },
  resCaption: { color: colors.textDim, fontFamily: fonts.medium, fontSize: 13, marginTop: 2, marginBottom: 8 },
  empty: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14, marginTop: 8 },
  rrBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  rrText: { fontFamily: fonts.bold, fontSize: 11 },
  bars: { flexDirection: 'row', height: 80, gap: 3, marginVertical: 12 },
  barCol: { backgroundColor: colors.gold, borderRadius: 3, opacity: 0.85 },
  tr: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: { flex: 1, color: colors.gold, fontFamily: fonts.bold, fontSize: 12, textAlign: 'right' },
  td: { flex: 1, color: colors.textDim, fontFamily: fonts.medium, fontSize: 13, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
