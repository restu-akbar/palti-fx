import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { LogoMark } from './src/components/Logo';
import { tap } from './src/components/motion';
import { IconName } from './src/components/ui';
import { StoreProvider, useStore } from './src/lib/store';
import { NavProvider, Route, TabKey, useNav } from './src/nav';
import { EduScreen, LessonScreen, ModuleScreen } from './src/screens/EduScreens';
import { HomeScreen } from './src/screens/HomeScreen';
import { JournalScreen, TradeFormScreen } from './src/screens/JournalScreens';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ToolScreen, ToolsScreen } from './src/screens/ToolScreens';
import { AchievementsScreen } from './src/screens/AchievementsScreen';
import { AchievementWatcher } from './src/components/AchievementWatcher';
import { colors, fonts, goldGradient } from './src/theme';

const native = Platform.OS !== 'web';

const TABS: { key: TabKey; label: string; icon: IconName; iconActive: IconName }[] = [
  { key: 'home', label: 'Beranda', icon: 'home-outline', iconActive: 'home' },
  { key: 'edu', label: 'Edukasi', icon: 'school-outline', iconActive: 'school' },
  { key: 'tools', label: 'Kalkulator', icon: 'calculator-outline', iconActive: 'calculator' },
  { key: 'journal', label: 'Jurnal', icon: 'book-outline', iconActive: 'book' },
];

function renderRoute(route: Route) {
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'edu':
      return <EduScreen />;
    case 'module':
      return <ModuleScreen moduleId={route.params.moduleId} />;
    case 'lesson':
      return <LessonScreen {...route.params} />;
    case 'tools':
      return <ToolsScreen />;
    case 'tool':
      return <ToolScreen toolId={route.params.toolId} />;
    case 'journal':
      return <JournalScreen />;
    case 'tradeForm':
      return <TradeFormScreen tradeId={route.params.tradeId} />;
    case 'achievements':
      return <AchievementsScreen />;
  }
}

/** Animasi masuk tiap kali layar berganti: geser saat push/pop, fade saat pindah tab. */
function Transition({ kind, children }: { kind: 'push' | 'pop' | 'tab'; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: kind === 'tab' ? 260 : 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native,
    }).start();
  }, [v, kind]);
  const dx = kind === 'push' ? 60 : kind === 'pop' ? -40 : 0;
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: v,
        transform: [
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [dx, 0] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [kind === 'tab' ? 0.985 : 1, 1] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function CurrentScreen() {
  const { route, depth, tab } = useNav();
  const prev = useRef({ depth, tab });
  const kind: 'push' | 'pop' | 'tab' =
    prev.current.tab !== tab ? 'tab' : depth > prev.current.depth ? 'push' : depth < prev.current.depth ? 'pop' : 'tab';
  useEffect(() => {
    prev.current = { depth, tab };
  });
  const key = `${tab}:${depth}:${JSON.stringify(route)}`;
  return (
    <Transition key={key} kind={kind}>
      {renderRoute(route)}
    </Transition>
  );
}

function TabBar() {
  const { tab, setTab } = useNav();
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
  const idx = TABS.findIndex((t) => t.key === tab);
  const x = useRef(new Animated.Value(idx)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: idx, useNativeDriver: native, speed: 16, bounciness: 7 }).start();
  }, [idx, x]);
  const tabW = w / TABS.length;
  return (
    <View style={[st.tabWrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(6,6,8,0)', 'rgba(6,6,8,0.92)', colors.bg]}
        locations={[0, 0.55, 1]}
        style={st.fade}
        pointerEvents="none"
      />
      <View style={st.tabBar} onLayout={(e) => setW(e.nativeEvent.layout.width - 12)}>
        {w > 0 && (
          <Animated.View
            style={[st.indicator, { width: tabW - 8, transform: [{ translateX: Animated.multiply(x, tabW) }] }]}
          >
            <LinearGradient colors={goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        )}
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => {
                tap('select');
                setTab(t.key);
              }}
              style={st.tabItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Ionicons name={active ? t.iconActive : t.icon} size={20} color={active ? colors.ink : colors.muted} />
              <Text style={[st.tabLabel, active && { color: colors.ink, fontFamily: fonts.bold }]} numberOfLines={1}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Splash Screen: LogoMark PALTI FX dengan animasi spring physics.
 * Logo mulai dari posisi miring, melayang masuk dengan putaran halus ke tengah,
 * lalu larut keluar dengan lembut. Menggunakan spring untuk motion yang natural.
 */
function Splash({ onFinish }: { onFinish: () => void }) {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => {});
    }

    // Spring entrance: natural deceleration tanpa easing buatan
    Animated.spring(progress, {
      toValue: 1,
      tension: 28,
      friction: 9,
      useNativeDriver: true,
    }).start();

    // Setelah logo settle (~1.4s), larut keluar ke Onboarding
    const exit = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => onFinishRef.current());
    }, 1400);

    return () => clearTimeout(exit);
  }, [progress, fade]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', zIndex: 9999, opacity: fade },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={{
          opacity: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }),
          transform: [
            { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-24deg', '0deg'] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] }) },
          ],
        }}
      >
        <LogoMark size={142} />
      </Animated.View>
    </Animated.View>
  );
}

function MainApp() {
  const { updateSettings } = useStore();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    ...Ionicons.font,
  });

  const [splashFinished, setSplashFinished] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  // Jika font masih belum termuat, render splash logo statis sejenak
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <LogoMark size={142} />
      </View>
    );
  }

  return (
    <View style={st.outer}>
      <View style={st.app}>
        <StatusBar style="light" />
        <CurrentScreen />
        <TabBar />
        <AchievementWatcher />
        {!onboarded && (
          <OnboardingScreen
            onDone={() => {
              setOnboarded(true);
              updateSettings({ welcomed: true });
            }}
          />
        )}
        {!splashFinished && (
          <Splash onFinish={() => setSplashFinished(true)} />
        )}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <NavProvider>
          <MainApp />
        </NavProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#000', alignItems: 'center' },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 },
  tabWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22,22,28,0.97)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  tabLabel: { color: colors.muted, fontFamily: fonts.semi, fontSize: 10.5, marginTop: 3 },
});
