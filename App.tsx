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
import { LogoMark } from './src/components/Logo';
import { tap } from './src/components/motion';
import { IconName } from './src/components/ui';
import { StoreProvider } from './src/lib/store';
import { NavProvider, Route, TabKey, useNav } from './src/nav';
import { EduScreen, LessonScreen, ModuleScreen } from './src/screens/EduScreens';
import { HomeScreen } from './src/screens/HomeScreen';
import { JournalScreen, TradeFormScreen } from './src/screens/JournalScreens';
import { ToolScreen, ToolsScreen } from './src/screens/ToolScreens';
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

function Splash() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 800, useNativeDriver: native }),
        Animated.timing(v, { toValue: 0.4, duration: 800, useNativeDriver: native }),
      ]),
    ).start();
  }, [v]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity: v }}>
        <LogoMark size={84} />
      </Animated.View>
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    ...Ionicons.font,
  });

  if (!loaded) return <Splash />;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <NavProvider>
          <View style={st.outer}>
            <View style={st.app}>
              <StatusBar style="light" />
              <CurrentScreen />
              <TabBar />
            </View>
          </View>
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
