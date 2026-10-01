import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedBar, FadeIn, ProgressRing, tap } from '../components/motion';
import { Card, Chip, GoldButton, IconBadge, Screen } from '../components/ui';
import { ALL_LESSONS, findModule, Module, MODULES } from '../data/modules';
import { useStore } from '../lib/store';
import { useNav } from '../nav';
import { colors, fonts } from '../theme';

const levelColor = (l: Module['level']) =>
  l === 'Pemula' ? colors.green : l === 'Menengah' ? colors.gold : colors.red;

export function EduScreen() {
  const nav = useNav();
  const { completed } = useStore();
  const done = ALL_LESSONS.filter((l) => completed[l.id]).length;
  const total = ALL_LESSONS.length;
  return (
    <Screen title="Edukasi" eyebrow="AKADEMI PALTI FX" subtitle="Belajar bertahap dari dasar sampai mahir">
      <FadeIn delay={60}>
        <Card gold style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ProgressRing value={total ? done / total : 0} size={64} stroke={7} track="rgba(255,255,255,0.08)">
            <Text style={st.ringText}>{total ? Math.round((done / total) * 100) : 0}%</Text>
          </ProgressRing>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={st.title}>Progres kamu</Text>
            <Text style={st.sub}>
              {done} dari {total} materi selesai
            </Text>
          </View>
        </Card>
      </FadeIn>

      <View style={{ gap: 12, marginTop: 18 }}>
        {MODULES.map((m, i) => {
          const d = m.lessons.filter((l) => completed[l.id]).length;
          return (
            <FadeIn key={m.id} delay={120 + i * 90}>
              <Card onPress={() => nav.push({ name: 'module', params: { moduleId: m.id } })}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconBadge name={m.icon} box={52} size={24} solid={d === m.lessons.length} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Chip label={m.level} color={levelColor(m.level)} />
                      <Text style={st.meta}>Modul {i + 1}</Text>
                    </View>
                    <Text style={st.title}>{m.title}</Text>
                    <Text style={st.sub}>{m.subtitle}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                  <View style={{ flex: 1 }}>
                    <AnimatedBar value={d / m.lessons.length} delay={300 + i * 90} />
                  </View>
                  <Text style={st.progressText}>
                    {d}/{m.lessons.length}
                  </Text>
                </View>
              </Card>
            </FadeIn>
          );
        })}
      </View>
    </Screen>
  );
}

export function ModuleScreen({ moduleId }: { moduleId: string }) {
  const nav = useNav();
  const { completed } = useStore();
  const m = findModule(moduleId);
  if (!m) return <Screen title="Modul tidak ditemukan"><View /></Screen>;
  const nextIdx = m.lessons.findIndex((l) => !completed[l.id]);
  return (
    <Screen title={m.title} eyebrow={m.level.toUpperCase()} subtitle={m.subtitle}>
      <View>
        {m.lessons.map((l, i) => {
          const done = !!completed[l.id];
          const isNext = i === nextIdx;
          const last = i === m.lessons.length - 1;
          return (
            <FadeIn key={l.id} delay={80 + i * 80} from="right">
              <View style={{ flexDirection: 'row' }}>
                {/* timeline */}
                <View style={{ width: 36, alignItems: 'center' }}>
                  <View style={[st.node, done && st.nodeDone, isNext && st.nodeNext]}>
                    {done ? (
                      <Ionicons name="checkmark" size={16} color={colors.ink} />
                    ) : (
                      <Text style={[st.nodeText, isNext && { color: colors.gold }]}>{i + 1}</Text>
                    )}
                  </View>
                  {!last && <View style={[st.line, done && { backgroundColor: colors.gold }]} />}
                </View>
                <View style={{ flex: 1, marginLeft: 10, paddingBottom: 12 }}>
                  <Card
                    gold={isNext}
                    onPress={() => nav.push({ name: 'lesson', params: { moduleId: m.id, lessonId: l.id } })}
                    style={{ paddingVertical: 14 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        {isNext && <Text style={st.nextLabel}>LANJUTKAN DI SINI</Text>}
                        <Text style={st.title}>{l.title}</Text>
                        <Text style={st.sub}>
                          <Ionicons name="time-outline" size={12} color={colors.muted} /> {l.minutes} menit baca
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={isNext ? colors.gold : colors.muted} />
                    </View>
                  </Card>
                </View>
              </View>
            </FadeIn>
          );
        })}
      </View>
    </Screen>
  );
}

export function LessonScreen({ moduleId, lessonId }: { moduleId: string; lessonId: string }) {
  const nav = useNav();
  const { completed, toggleLesson } = useStore();
  const m = findModule(moduleId);
  const idx = m?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const lesson = m && idx >= 0 ? m.lessons[idx] : undefined;
  if (!m || !lesson) return <Screen title="Materi tidak ditemukan"><View /></Screen>;
  const next = m.lessons[idx + 1];
  const done = !!completed[lesson.id];

  return (
    <Screen title={lesson.title} eyebrow={`${m.title.toUpperCase()} · BAB ${idx + 1}/${m.lessons.length}`}>
      <FadeIn delay={80}>
        <View style={st.metaRow}>
          <Chip label={`${lesson.minutes} menit`} color={colors.textDim} />
          {done && <Chip label="Selesai" color={colors.green} />}
        </View>
        <View style={{ marginBottom: 12 }}>
          <AnimatedBar value={(idx + (done ? 1 : 0)) / m.lessons.length} height={4} />
        </View>
      </FadeIn>
      <FadeIn delay={160}>
        <RichText content={lesson.content} />
      </FadeIn>
      <View style={{ marginTop: 28, gap: 10 }}>
        {next ? (
          <GoldButton
            title={done ? 'Materi berikutnya' : 'Selesai & lanjut'}
            icon="arrow-forward"
            onPress={() => {
              tap('success');
              toggleLesson(lesson.id, true);
              nav.pop();
              nav.push({ name: 'lesson', params: { moduleId: m.id, lessonId: next.id } });
            }}
          />
        ) : (
          !done && (
            <GoldButton
              title="Tandai modul selesai"
              icon="trophy"
              onPress={() => {
                tap('success');
                toggleLesson(lesson.id, true);
                nav.pop();
              }}
            />
          )
        )}
        {done ? <GoldButton title="Tandai belum selesai" variant="outline" onPress={() => toggleLesson(lesson.id, false)} /> : null}
      </View>
    </Screen>
  );
}

/** Render format sederhana: ## judul, - poin, > catatan, paragraf. */
export function RichText({ content }: { content: string }) {
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  const flush = (key: string) => {
    if (para.length) {
      blocks.push(
        <Text key={key} style={st.p}>
          {para.join(' ')}
        </Text>,
      );
      para = [];
    }
  };
  content.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return flush('p' + i);
    if (line.startsWith('## ')) {
      flush('p' + i);
      blocks.push(
        <View key={i} style={st.h2Row}>
          <View style={st.h2Bar} />
          <Text style={st.h2}>{line.slice(3)}</Text>
        </View>,
      );
    } else if (line.startsWith('- ')) {
      flush('p' + i);
      blocks.push(
        <View key={i} style={st.bulletRow}>
          <View style={st.bullet} />
          <Text style={[st.p, { flex: 1, marginBottom: 8 }]}>{line.slice(2)}</Text>
        </View>,
      );
    } else if (line.startsWith('> ')) {
      flush('p' + i);
      blocks.push(
        <LinearGradient
          key={i}
          colors={['rgba(237,193,58,0.16)', 'rgba(237,193,58,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.tip}
        >
          <View style={st.tipIcon}>
            <Ionicons name="bulb" size={16} color={colors.ink} />
          </View>
          <Text style={[st.p, { flex: 1, marginBottom: 0, color: colors.text, fontFamily: fonts.medium }]}>
            {line.slice(2)}
          </Text>
        </LinearGradient>,
      );
    } else {
      para.push(line);
    }
  });
  flush('end');
  return <View>{blocks}</View>;
}

const st = StyleSheet.create({
  ringText: { color: colors.goldLight, fontFamily: fonts.display, fontSize: 15 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, letterSpacing: -0.2 },
  sub: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, marginTop: 3 },
  meta: { color: colors.muted, fontFamily: fonts.semi, fontSize: 12 },
  progressText: { color: colors.gold, fontFamily: fonts.bold, fontSize: 12, marginLeft: 10 },
  node: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  nodeDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  nodeNext: { borderColor: colors.gold },
  nodeText: { color: colors.muted, fontFamily: fonts.bold, fontSize: 13 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
  nextLabel: { color: colors.gold, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  h2Row: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  h2Bar: { width: 4, height: 20, borderRadius: 2, backgroundColor: colors.gold, marginRight: 10 },
  h2: { color: colors.text, fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.3, flex: 1 },
  p: { color: colors.textDim, fontFamily: fonts.body, fontSize: 16, lineHeight: 27, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 2 },
  bullet: { width: 7, height: 7, borderRadius: 2, backgroundColor: colors.gold, marginTop: 10, marginRight: 12, transform: [{ rotate: '45deg' }] },
  tip: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(237,193,58,0.25)',
    padding: 16,
    marginVertical: 12,
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
