import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '../components/Logo';
import { PressScale, Shimmer, tap } from '../components/motion';
import { colors, fonts, goldGradient } from '../theme';

const native = Platform.OS !== 'web';

/**
 * Layar sambutan eksklusif — tampil sekali saat aplikasi pertama kali dibuka.
 * Urutan animasi: cahaya → simbol → garis emas → teks → tombol.
 */
export function WelcomeScreen({ onEnter }: { onEnter: (name: string) => void }) {
  const insets = useSafeAreaInsets();
  const glow = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const cta = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const [btnW, setBtnW] = useState(300);
  const [name, setName] = useState('');
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    const t = (v: Animated.Value, duration: number, delay = 0) =>
      Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: native });
    Animated.parallel([
      t(glow, 1400),
      t(logo, 1100, 250),
      t(line, 800, 1100),
      t(text, 800, 1400),
      t(cta, 700, 1900),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
        Animated.timing(breathe, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow, logo, line, text, cta, breathe]);

  const enter = () => {
    tap('success');
    Animated.timing(out, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: native }).start(() => onEnter(name.trim()));
  };

  const up = (v: Animated.Value, d = 16) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [d, 0] }) }],
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        st.root,
        {
          opacity: out,
          transform: [{ scale: out.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }],
        },
      ]}
    >
      {/* cahaya emas di belakang simbol */}
      <Animated.View
        pointerEvents="none"
        style={[
          st.glowWrap,
          {
            opacity: Animated.multiply(glow, breathe.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.9] })),
            transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] }) }],
          },
        ]}
      >
        {[360, 280, 210, 150].map((d, i) => (
          <View
            key={d}
            style={{
              position: 'absolute',
              width: d,
              height: d,
              borderRadius: d / 2,
              backgroundColor: `rgba(237,193,58,${0.035 + i * 0.02})`,
            }}
          />
        ))}
      </Animated.View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[st.center, { paddingTop: insets.top + 40 }]}>
        <Animated.View
          style={{
            opacity: logo,
            transform: [
              { scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
              { rotate: logo.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) },
            ],
          }}
        >
          <LogoMark size={128} />
        </Animated.View>

        <Animated.View style={[st.lineWrap, { transform: [{ scaleX: line }], opacity: line }]}>
          <LinearGradient
            colors={['transparent', colors.gold, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1, width: '100%' }}
          />
        </Animated.View>

        <Animated.View style={[{ alignItems: 'center' }, up(text)]}>
          <Text style={st.eyebrow}>MEMBERS ONLY</Text>
          <Text style={st.title}>Welcome to the</Text>
          <Text style={[st.title, st.titleGold]}>Inner Circle</Text>
          <Text style={st.body}>
            Ruang eksklusif untuk komunitas VIP.{'\n'}Belajar, berhitung, dan evaluasi trading{'\n'}dalam satu tempat privat.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[st.bottom, { paddingBottom: insets.bottom + 28 }, up(cta, 24)]}>
        <Text style={st.nameLabel}>Bagaimana kami memanggilmu?</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nama panggilan"
          placeholderTextColor={colors.muted}
          maxLength={20}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={enter}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          selectionColor={colors.gold}
          style={[st.nameInput, focus && { borderColor: colors.gold }]}
        />
        <PressScale onPress={enter} scaleTo={0.96} accessibilityLabel="Masuk">
          <LinearGradient
            colors={goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.btn}
            onLayout={(e) => setBtnW(e.nativeEvent.layout.width)}
          >
            <Shimmer width={btnW} every={3200} />
            <Text style={st.btnText}>Masuk</Text>
          </LinearGradient>
        </PressScale>
        <View style={st.footRow}>
          <View style={st.footDot} />
          <Text style={st.foot}>PRIVATE ACCESS</Text>
          <View style={st.footDot} />
        </View>
      </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  root: { backgroundColor: colors.bg, zIndex: 50, elevation: 50 },
  glowWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: '9%',
    width: 360,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  lineWrap: { width: 180, marginTop: 28, marginBottom: 22 },
  eyebrow: { color: colors.gold, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 5, marginBottom: 14 },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 26, letterSpacing: -0.4, textAlign: 'center' },
  titleGold: { color: colors.goldLight, fontFamily: fonts.display, fontSize: 38, letterSpacing: -1, marginTop: 2 },
  body: {
    color: colors.textDim,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 18,
  },
  bottom: { paddingHorizontal: 24 },
  nameLabel: { color: colors.textDim, fontFamily: fonts.semi, fontSize: 13, textAlign: 'center', marginBottom: 10 },
  nameInput: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 12,
    outlineWidth: 0,
  },
  btn: {
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnText: { color: colors.ink, fontFamily: fonts.display, fontSize: 17, letterSpacing: 1.5 },
  footRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18 },
  footDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.goldDark },
  foot: { color: colors.muted, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 3 },
});
