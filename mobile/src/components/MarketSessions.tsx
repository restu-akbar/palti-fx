import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { hh, marketStatus, SESSIONS, toWib } from '../lib/sessions';
import { colors, fonts } from '../theme';
import { Card } from './ui';
import { Pulse } from './motion';

export function MarketSessions() {
  const [now, setNow] = useState(new Date());
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const st = marketStatus(now);
  const wibClock = `${String(Math.floor(st.wibH)).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
  const LABEL_W = 70;
  const trackW = Math.max(0, w - LABEL_W);
  const x = (h: number) => (h / 24) * trackW;

  const statusText = st.weekend
    ? 'Pasar tutup · akhir pekan'
    : st.overlapLN
      ? 'Overlap London–New York · paling ramai'
      : st.active.length
        ? `Buka: ${st.active.map((a) => a.name).join(' & ')}`
        : 'Transisi sesi';

  return (
    <Card>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Sesi Pasar</Text>
          <View style={s.statusRow}>
            {st.weekend ? (
              <View style={[s.dot, { backgroundColor: colors.muted }]} />
            ) : (
              <Pulse color={st.overlapLN ? colors.gold : colors.green} size={7} />
            )}
            <Text style={[s.status, { color: st.weekend ? colors.muted : st.overlapLN ? colors.gold : colors.green }]}>
              {statusText}
            </Text>
          </View>
        </View>
        <View style={s.clock}>
          <Text style={s.clockText}>{wibClock}</Text>
          <Text style={s.clockSub}>WIB</Text>
        </View>
      </View>

      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ marginTop: 14 }}>
        {SESSIONS.map((ss) => {
          const a = toWib(ss.start);
          const b = toWib(ss.end);
          const segs = a < b ? [[a, b]] : [[a, 24], [0, b]];
          const on = st.active.some((x) => x.key === ss.key);
          return (
            <View key={ss.key} style={s.row}>
              <View style={{ width: LABEL_W }}>
                <Text style={[s.rowName, on && { color: colors.text }]}>{ss.name}</Text>
                <Text style={s.rowTime}>
                  {hh(a)}–{hh(b)}
                </Text>
              </View>
              <View style={[s.track, { width: trackW }]}>
                {segs.map(([p, q], i) => (
                  <View
                    key={i}
                    style={[
                      s.band,
                      { left: x(p), width: x(q) - x(p), backgroundColor: ss.color, opacity: on ? 0.95 : 0.28 },
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })}
        {trackW > 0 && (
          <View style={[s.needle, { left: LABEL_W + x(st.wibH) }]} pointerEvents="none">
            <View style={s.needleHead} />
          </View>
        )}
        <View style={[s.axis, { marginLeft: LABEL_W }]}>
          {[0, 6, 12, 18, 24].map((h) => (
            <Text key={h} style={s.axisText}>
              {String(h).padStart(2, '0')}
            </Text>
          ))}
        </View>
      </View>
      <Text style={s.foot}>Jam perkiraan, bisa bergeser ±1 jam saat pergantian musim.</Text>
    </Card>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 17, letterSpacing: -0.2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: -5 },
  status: { fontFamily: fonts.semi, fontSize: 12, marginLeft: 2, flexShrink: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, marginHorizontal: 6 },
  clock: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clockText: { color: colors.text, fontFamily: fonts.display, fontSize: 18, fontVariant: ['tabular-nums'] },
  clockSub: { color: colors.muted, fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', height: 34 },
  rowName: { color: colors.textDim, fontFamily: fonts.semi, fontSize: 12 },
  rowTime: { color: colors.muted, fontFamily: fonts.body, fontSize: 10, marginTop: 1 },
  track: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.05)' },
  band: { position: 'absolute', top: 0, bottom: 0, borderRadius: 5 },
  needle: { position: 'absolute', top: -4, bottom: 16, width: 2, marginLeft: -1, backgroundColor: colors.text },
  needleHead: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text,
    borderWidth: 2,
    borderColor: colors.card,
  },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 10 },
  foot: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 10 },
});
