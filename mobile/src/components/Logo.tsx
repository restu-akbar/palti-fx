import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { SYMBOL_PATH, SYMBOL_VB, WORDMARK_PATH, WORDMARK_VB } from './logoPaths';

/**
 * Logo resmi PALTI FX (anyaman dalam lingkaran).
 * variant:
 *  - 'gold'  : gradasi emas, selaras dengan warna aplikasi (default)
 *  - 'flat'  : kuning asli logo
 *  - 'ink'   : warna gelap (untuk di atas kartu emas)
 */
type Variant = 'gold' | 'flat' | 'ink';

function Fill({ id, variant, h }: { id: string; variant: Variant; h: number }) {
  if (variant !== 'gold') return null;
  return (
    <Defs>
      <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={h}>
        <Stop offset="0" stopColor="#FCE7A0" />
        <Stop offset="0.45" stopColor="#EDC13A" />
        <Stop offset="1" stopColor="#B8891A" />
      </LinearGradient>
    </Defs>
  );
}

const color = (variant: Variant, id: string) =>
  variant === 'gold' ? `url(#${id})` : variant === 'flat' ? '#FCD404' : 'rgba(22,17,10,1)';

export function LogoMark({ size = 64, variant = 'gold', opacity = 1 }: { size?: number; variant?: Variant; opacity?: number }) {
  const id = `pfxSym${variant}`;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${SYMBOL_VB.w} ${SYMBOL_VB.h}`} opacity={opacity}>
      <Fill id={id} variant={variant} h={SYMBOL_VB.h} />
      <Path d={SYMBOL_PATH} fill={color(variant, id)} fillRule="evenodd" />
    </Svg>
  );
}

export function Wordmark({ width = 140, variant = 'gold' }: { width?: number; variant?: Variant }) {
  const id = `pfxWm${variant}`;
  const h = (width * WORDMARK_VB.h) / WORDMARK_VB.w;
  return (
    <Svg width={width} height={h} viewBox={`0 0 ${WORDMARK_VB.w} ${WORDMARK_VB.h}`}>
      <Fill id={id} variant={variant} h={WORDMARK_VB.h} />
      <Path d={WORDMARK_PATH} fill={color(variant, id)} fillRule="evenodd" />
    </Svg>
  );
}

/** Logo lengkap: simbol + tulisan "Palti FX / FOREX" (untuk splash & halaman pembuka). */
export function LogoFull({ width = 180, variant = 'gold' }: { width?: number; variant?: Variant }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <LogoMark size={width * 0.86} variant={variant} />
      <View style={{ height: width * 0.1 }} />
      <Wordmark width={width} variant={variant} />
    </View>
  );
}
