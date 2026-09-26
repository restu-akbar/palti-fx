import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INSTRUMENTS } from '../lib/instruments';
import { useNav } from '../nav';
import { cardGradient, colors, fonts, goldGradient, radius } from '../theme';
import { AnimatedBar, FadeIn, PressScale, tap } from './motion';

export type IconName = keyof typeof Ionicons.glyphMap;

const native = Platform.OS !== 'web';
const BAR_H = 54;

/**
 * Kerangka layar: judul besar yang mengecil jadi bar ringkas saat di-scroll.
 */
export function Screen({
  title,
  subtitle,
  children,
  right,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  eyebrow?: string;
}) {
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const canBack = nav.depth > 1;
  const y = useRef(new Animated.Value(0)).current;
  const barOpacity = y.interpolate({ inputRange: [30, 70], outputRange: [0, 1], extrapolate: 'clamp' });
  const titleShift = y.interpolate({ inputRange: [-100, 0, 100], outputRange: [20, 0, -30], extrapolate: 'clamp' });
  const titleFade = y.interpolate({ inputRange: [0, 60], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: insets.top + BAR_H, paddingHorizontal: 18, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], { useNativeDriver: native })}
      >
        <Animated.View style={{ opacity: titleFade, transform: [{ translateY: titleShift }], marginBottom: 18 }}>
          <FadeIn from="up" distance={10}>
            {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
            <Text style={s.bigTitle}>{title}</Text>
            {subtitle ? <Text style={s.bigSub}>{subtitle}</Text> : null}
          </FadeIn>
        </Animated.View>
        {children}
      </Animated.ScrollView>

      {/* bar ringkas di atas */}
      <View style={[s.bar, { paddingTop: insets.top, height: insets.top + BAR_H }]} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, s.barBg, { opacity: barOpacity }]} />
        {canBack ? (
          <PressScale onPress={nav.pop} style={s.backBtn} accessibilityLabel="Kembali" hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </PressScale>
        ) : (
          <View style={{ width: 4 }} />
        )}
        <Animated.Text style={[s.barTitle, { opacity: barOpacity }]} numberOfLines={1}>
          {title}
        </Animated.Text>
        <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
      </View>
    </View>
  );
}

export function Card({
  children,
  style,
  gold,
  onPress,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gold?: boolean;
  onPress?: () => void;
  padded?: boolean;
}) {
  const inner = (
    <LinearGradient
      colors={cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={[s.card, !padded && { padding: 0 }, gold && { borderColor: colors.borderGold }, style]}
    >
      <View style={s.cardHighlight} pointerEvents="none" />
      {children}
    </LinearGradient>
  );
  if (!onPress) return inner;
  return <PressScale onPress={onPress}>{inner}</PressScale>;
}

export function GoldButton({
  title,
  onPress,
  icon,
  variant = 'solid',
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'solid' | 'outline' | 'danger' | 'dark';
  style?: StyleProp<ViewStyle>;
}) {
  if (variant !== 'solid') {
    const c = variant === 'danger' ? colors.red : variant === 'dark' ? colors.goldLight : colors.gold;
    return (
      <PressScale
        onPress={onPress}
        style={[
          s.btn,
          variant === 'dark'
            ? { backgroundColor: colors.ink }
            : { borderWidth: 1, borderColor: c + '66', backgroundColor: c + '10' },
          style,
        ]}
      >
        {icon && <Ionicons name={icon} size={18} color={c} style={{ marginRight: 8 }} />}
        <Text style={[s.btnText, { color: c }]}>{title}</Text>
      </PressScale>
    );
  }
  return (
    <PressScale onPress={onPress} style={style}>
      <LinearGradient colors={goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.btn, s.btnGlow]}>
        {icon && <Ionicons name={icon} size={18} color={colors.ink} style={{ marginRight: 8 }} />}
        <Text style={[s.btnText, { color: colors.ink }]}>{title}</Text>
      </LinearGradient>
    </PressScale>
  );
}

export function Label({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.label, style]}>{children}</Text>;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  suffix,
  hint,
  keyboard = 'decimal-pad',
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  suffix?: string;
  hint?: string;
  keyboard?: 'decimal-pad' | 'default' | 'numbers-and-punctuation';
  multiline?: boolean;
}) {
  const f = useRef(new Animated.Value(0)).current;
  const setFocus = (on: boolean) =>
    Animated.timing(f, { toValue: on ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  const borderColor = f.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.gold] });
  const bg = f.interpolate({ inputRange: [0, 1], outputRange: [colors.surface, '#16140F'] });
  return (
    <View style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <Animated.View
        style={[s.inputWrap, { borderColor, backgroundColor: bg }, multiline && { alignItems: 'flex-start' }]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboard}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          multiline={multiline}
          selectionColor={colors.gold}
          style={[s.input, multiline && { minHeight: 90, textAlignVertical: 'top', paddingTop: 14 }]}
        />
        {suffix ? (
          <View style={s.suffixPill}>
            <Text style={s.suffix}>{suffix}</Text>
          </View>
        ) : null}
      </Animated.View>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

/** Pilihan tersegmentasi dengan indikator yang bergeser. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  const [w, setW] = useState(0);
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const x = useRef(new Animated.Value(idx)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: idx, useNativeDriver: native, speed: 18, bounciness: 6 }).start();
  }, [idx, x]);
  const segW = w ? (w - 8) / options.length : 0;
  const activeColor = options[idx]?.color ?? colors.gold;
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Label>{label}</Label> : null}
      <View style={s.seg} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
        {segW > 0 && (
          <Animated.View
            style={[
              s.segThumb,
              {
                width: segW,
                backgroundColor: activeColor + '22',
                borderColor: activeColor + '88',
                transform: [{ translateX: Animated.multiply(x, segW) }],
              },
            ]}
          />
        )}
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => {
                if (!active) tap('select');
                onChange(o.value);
              }}
              style={s.segItem}
            >
              <Text style={[s.segText, active && { color: o.color ?? colors.goldLight, fontFamily: fonts.bold }]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Bottom sheet dengan animasi geser. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const v = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(v, { toValue: 1, useNativeDriver: native, speed: 14, bounciness: 4 }).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: native }).start(
        () => setMounted(false),
      );
    }
  }, [visible, v]);
  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: v }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            s.sheet,
            {
              paddingBottom: insets.bottom + 20,
              transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }],
            },
          ]}
        >
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{title}</Text>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export function InstrumentPicker({
  value,
  onChange,
  label = 'Pair / Instrumen',
}: {
  value: string;
  onChange: (symbol: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const groups = ['Komoditas', 'Major', 'Minor'] as const;
  const inst = INSTRUMENTS.find((i) => i.symbol === value);
  return (
    <View style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <PressScale onPress={() => setOpen(true)} style={[s.inputWrap, s.picker]} scaleTo={0.98}>
        <View style={s.pickerIcon}>
          <Text style={s.pickerIconText}>{inst?.base === 'XAU' ? 'Au' : inst?.base === 'XAG' ? 'Ag' : inst?.base.slice(0, 2)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.pickerValue}>{value}</Text>
          <Text style={s.pickerSub}>{inst?.group}</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.gold} style={{ marginRight: 14 }} />
      </PressScale>
      <Sheet visible={open} onClose={() => setOpen(false)} title="Pilih Instrumen">
        <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
          {groups.map((g) => (
            <View key={g} style={{ marginBottom: 14 }}>
              <Text style={s.groupLabel}>{g.toUpperCase()}</Text>
              <View style={s.chips}>
                {INSTRUMENTS.filter((i) => i.group === g).map((i) => {
                  const active = i.symbol === value;
                  return (
                    <PressScale
                      key={i.symbol}
                      onPress={() => {
                        onChange(i.symbol);
                        setOpen(false);
                      }}
                      style={[s.chip, active && s.chipActive]}
                    >
                      <Text style={[s.chipText, active && { color: colors.ink }]}>{i.symbol}</Text>
                    </PressScale>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </Sheet>
    </View>
  );
}

export function ResultRow({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <View style={s.resultRow}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={s.resultLabel}>{label}</Text>
        {sub ? <Text style={s.resultSub}>{sub}</Text> : null}
      </View>
      <Text style={[s.resultValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export function SectionTitle({
  children,
  action,
  onAction,
}: {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{children}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={s.sectionAction}>{action}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.gold} style={{ marginLeft: 4 }} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Note({ children, icon = 'information-circle' }: { children: React.ReactNode; icon?: IconName }) {
  return (
    <View style={s.note}>
      <Ionicons name={icon} size={16} color={colors.gold} style={{ marginTop: 1, marginRight: 10 }} />
      <Text style={s.noteText}>{children}</Text>
    </View>
  );
}

export function IconBadge({ name, size = 22, box = 46, solid }: { name: IconName; size?: number; box?: number; solid?: boolean }) {
  if (solid) {
    return (
      <LinearGradient colors={goldGradient} style={[s.iconBadge, { width: box, height: box, borderWidth: 0 }]}>
        <Ionicons name={name} size={size} color={colors.ink} />
      </LinearGradient>
    );
  }
  return (
    <View style={[s.iconBadge, { width: box, height: box }]}>
      <Ionicons name={name} size={size} color={colors.gold} />
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return <AnimatedBar value={value} />;
}

export function Chip({ label, color = colors.gold }: { label: string; color?: string }) {
  return (
    <View style={[s.tag, { backgroundColor: color + '1A', borderColor: color + '55' }]}>
      <Text style={[s.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  barBg: {
    backgroundColor: 'rgba(6,6,8,0.94)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  barTitle: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 16, marginHorizontal: 12 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { color: colors.gold, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 2, marginBottom: 6 },
  bigTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.8, lineHeight: 36 },
  bigSub: { color: colors.muted, fontFamily: fonts.medium, fontSize: 14, marginTop: 6 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    overflow: 'hidden',
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btn: {
    height: 54,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  btnGlow: {
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnText: { fontFamily: fonts.bold, fontSize: 15, letterSpacing: 0.2 },
  label: {
    color: colors.textDim,
    fontFamily: fonts.semi,
    fontSize: 12,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 54,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.semi,
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
    outlineWidth: 0,
  },
  suffixPill: {
    marginRight: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(227,182,79,0.12)',
  },
  suffix: { color: colors.gold, fontFamily: fonts.bold, fontSize: 12 },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 7, lineHeight: 17 },
  seg: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    height: 50,
  },
  segThumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segText: { color: colors.muted, fontFamily: fonts.semi, fontSize: 14 },
  picker: { paddingVertical: 8 },
  pickerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(227,182,79,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 12,
  },
  pickerIconText: { color: colors.gold, fontFamily: fonts.display, fontSize: 13 },
  pickerValue: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  pickerSub: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11, marginTop: 1 },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 20,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 16,
  },
  sheetTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 22, marginBottom: 16, letterSpacing: -0.4 },
  groupLabel: { color: colors.muted, fontFamily: fonts.bold, fontSize: 11, marginBottom: 10, letterSpacing: 1.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.textDim, fontFamily: fonts.bold, fontSize: 14 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultLabel: { color: colors.textDim, fontFamily: fonts.medium, fontSize: 14 },
  resultSub: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  resultValue: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 19, letterSpacing: -0.3 },
  sectionAction: { color: colors.gold, fontFamily: fonts.semi, fontSize: 13 },
  note: {
    flexDirection: 'row',
    backgroundColor: 'rgba(227,182,79,0.07)',
    borderRadius: radius.md,
    padding: 14,
    marginTop: 14,
  },
  noteText: { flex: 1, color: colors.textDim, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  iconBadge: {
    borderRadius: 15,
    backgroundColor: 'rgba(227,182,79,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(227,182,79,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  tagText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.4 },
});
