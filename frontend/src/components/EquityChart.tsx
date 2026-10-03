import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { usd } from '../lib/format';
import { colors, fonts } from '../theme';

export function EquityChart({ data, height = 140, mini }: { data: number[]; height?: number; mini?: boolean }) {
  const [w, setW] = useState(0);
  if (data.length < 2) {
    if (mini) return <View style={{ height }} />;
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>
          Kurva equity muncul setelah ada catatan trade.
        </Text>
      </View>
    );
  }
  const min = Math.min(0, ...data);
  const max = Math.max(0, ...data);
  const span = max - min || 1;
  const padY = 10;
  const h = height - padY * 2;
  const x = (i: number) => 4 + (i / (data.length - 1)) * (w - 8);
  const y = (v: number) => padY + h - ((v - min) / span) * h;
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1)},${y(min)} L${x(0)},${y(min)} Z`;
  const last = data[data.length - 1];
  const stroke = last >= 0 ? colors.gold : colors.red;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }}>
      {w > 0 && (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id="a" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity="0.35" />
              <Stop offset="1" stopColor={stroke} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {!mini && <Line x1="0" x2={w} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />}
          <Path d={area} fill="url(#a)" />
          <Path d={line} stroke={stroke} strokeWidth={2.2} fill="none" strokeLinejoin="round" />
          <Circle cx={x(data.length - 1)} cy={y(last)} r={4} fill={stroke} stroke={colors.card} strokeWidth={2} />
        </Svg>
      )}
      {!mini && <Text style={{ position: 'absolute', right: 0, top: 0, color: colors.muted, fontSize: 11, fontFamily: fonts.body }}>
        {usd(max, 0)}
      </Text>}
      {!mini && min < 0 && (
        <Text style={{ position: 'absolute', right: 0, bottom: 0, color: colors.muted, fontSize: 11, fontFamily: fonts.body }}>
          {usd(min, 0)}
        </Text>
      )}
    </View>
  );
}
