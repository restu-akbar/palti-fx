import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Line, Rect, Stop } from 'react-native-svg';

/** Monogram PALTI FX: cincin emas dengan tiga candlestick naik. */
export function LogoMark({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
          <Stop offset="0" stopColor="#F3DC8B" />
          <Stop offset="0.5" stopColor="#D4AF37" />
          <Stop offset="1" stopColor="#8A6A18" />
        </LinearGradient>
      </Defs>
      <Circle cx="50" cy="50" r="46" fill="#0E0D0B" stroke="url(#g)" strokeWidth="3" />
      <Circle cx="50" cy="50" r="39" fill="none" stroke="url(#g)" strokeWidth="0.8" opacity="0.6" />
      {/* candle 1 */}
      <Line x1="33" y1="50" x2="33" y2="74" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" />
      <Rect x="28" y="55" width="10" height="14" rx="1.5" fill="url(#g)" />
      {/* candle 2 */}
      <Line x1="50" y1="36" x2="50" y2="66" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" />
      <Rect x="45" y="41" width="10" height="19" rx="1.5" fill="url(#g)" />
      {/* candle 3 */}
      <Line x1="67" y1="22" x2="67" y2="56" stroke="url(#g)" strokeWidth="2" strokeLinecap="round" />
      <Rect x="62" y="27" width="10" height="23" rx="1.5" fill="url(#g)" />
    </Svg>
  );
}
