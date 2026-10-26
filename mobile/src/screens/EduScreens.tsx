import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AnimatedBar, CompletionPulse, FadeIn, ProgressRing, tap } from '../components/motion';
import { Card, Chip, GoldButton, IconBadge, Screen } from '../components/ui';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { VideoFilePlayer } from '../components/VideoFilePlayer';
import { useEdu } from '../context/EduContext';
import { Module } from '../data/modules';
import { extractYouTubeId, isDirectVideoUrl } from '../lib/eduService';
import { useStore } from '../lib/store';
import { useNav } from '../nav';
import { colors, fonts } from '../theme';

const levelColor = (l: Module['level']) =>
  l === 'Pemula' ? colors.green : l === 'Menengah' ? colors.gold : colors.red;

export interface MatchedLessonItem {
  moduleId: string;
  moduleTitle: string;
  moduleIndex: number;
  moduleLevel: Module['level'];
  moduleIcon: any;
  lessonId: string;
  lessonTitle: string;
  lessonIndex: number;
  minutes: number;
  hasVideo: boolean;
  matchType: 'title' | 'subbab' | 'content' | 'module';
  matchedSubbab?: string;
  snippet?: string;
}

/**
 * Mencari bab dan subbab di seluruh kurikulum berdasarkan kata kunci
 */
export function searchEduLessons(modules: Module[], rawQuery: string): MatchedLessonItem[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const results: MatchedLessonItem[] = [];

  modules.forEach((mod, modIdx) => {
    const modTitle = mod.title || '';
    const lessons = mod.lessons || [];

    lessons.forEach((les, lesIdx) => {
      const lesTitle = les.title || '';
      const lesContent = les.content || '';
      const lesMinutes = les.minutes || 0;
      const hasVideo = !!((les.youtubeUrls && les.youtubeUrls.length > 0) || extractYouTubeId(lesContent) || lesContent.split('\n').some(isDirectVideoUrl));

      // 1. Cek Judul Bab
      if (lesTitle.toLowerCase().includes(query)) {
        results.push({
          moduleId: mod.id,
          moduleTitle: modTitle,
          moduleIndex: modIdx + 1,
          moduleLevel: mod.level,
          moduleIcon: mod.icon,
          lessonId: les.id,
          lessonTitle: lesTitle,
          lessonIndex: lesIdx + 1,
          minutes: lesMinutes,
          hasVideo,
          matchType: 'title',
        });
        return;
      }

      // 2. Parse subbab & konten di dalam markdown
      const lines = lesContent.split('\n');
      let currentSubbab = '';
      let matchedSubbab: string | undefined;
      let matchedSnippet: string | undefined;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
        if (headingMatch) {
          currentSubbab = headingMatch[1].trim();
          if (currentSubbab.toLowerCase().includes(query)) {
            matchedSubbab = currentSubbab;
            break;
          }
        } else if (line.toLowerCase().includes(query)) {
          if (!matchedSnippet) {
            const clean = line.replace(/^[->*#]+\s*/, '').replace(/[*_`]/g, '').trim();
            if (clean) {
              const matchIdx = clean.toLowerCase().indexOf(query);
              const start = Math.max(0, matchIdx - 20);
              const end = Math.min(clean.length, matchIdx + query.length + 40);
              const snippetText = (start > 0 ? '...' : '') + clean.slice(start, end) + (end < clean.length ? '...' : '');
              matchedSnippet = snippetText;
              if (currentSubbab) {
                matchedSubbab = currentSubbab;
              }
            }
          }
        }
      }

      if (matchedSubbab) {
        results.push({
          moduleId: mod.id,
          moduleTitle: modTitle,
          moduleIndex: modIdx + 1,
          moduleLevel: mod.level,
          moduleIcon: mod.icon,
          lessonId: les.id,
          lessonTitle: lesTitle,
          lessonIndex: lesIdx + 1,
          minutes: lesMinutes,
          hasVideo,
          matchType: 'subbab',
          matchedSubbab,
          snippet: matchedSnippet,
        });
        return;
      }

      if (matchedSnippet) {
        results.push({
          moduleId: mod.id,
          moduleTitle: modTitle,
          moduleIndex: modIdx + 1,
          moduleLevel: mod.level,
          moduleIcon: mod.icon,
          lessonId: les.id,
          lessonTitle: lesTitle,
          lessonIndex: lesIdx + 1,
          minutes: lesMinutes,
          hasVideo,
          matchType: 'content',
          snippet: matchedSnippet,
        });
        return;
      }

      // 3. Cek Judul Modul
      if (modTitle.toLowerCase().includes(query)) {
        results.push({
          moduleId: mod.id,
          moduleTitle: modTitle,
          moduleIndex: modIdx + 1,
          moduleLevel: mod.level,
          moduleIcon: mod.icon,
          lessonId: les.id,
          lessonTitle: lesTitle,
          lessonIndex: lesIdx + 1,
          minutes: lesMinutes,
          hasVideo,
          matchType: 'module',
        });
      }
    });
  });

  return results;
}

/* ═══════════════════════════════════════════════════════════════════════
   1. EDU SCREEN (Daftar Seluruh Modul)
   ═══════════════════════════════════════════════════════════════════════ */
export function EduScreen() {
  const nav = useNav();
  const { completed } = useStore();
  const { modules, refreshing, refresh } = useEdu();
  const [searchQuery, setSearchQuery] = useState('');

  // Otomatis refresh seketika saat user masuk ke halaman edukasi
  useEffect(() => {
    refresh(true);
  }, [refresh]);

  // Hitung total lesson secara dinamis
  const allLessons = modules.flatMap((m) => m.lessons);
  const done = allLessons.filter((l) => completed[l.id]).length;
  const total = allLessons.length;

  const searchResults = useMemo(() => {
    return searchEduLessons(modules, searchQuery);
  }, [modules, searchQuery]);

  return (
    <Screen
      title="Edukasi"
      eyebrow="AKADEMI PALTI FX"
      subtitle="Belajar bertahap dari dasar sampai mahir"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => refresh(true)}
          tintColor={colors.gold}
          colors={[colors.gold]}
          progressBackgroundColor={colors.card}
        />
      }
    >
      {/* ── Progress Card ── */}
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

      {/* ── Search Bar Input ── */}
      <FadeIn delay={90}>
        <View style={st.searchBox}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari bab atau subbab materi..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            selectionColor={colors.gold}
            autoCorrect={false}
            returnKeyType="search"
            style={st.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
            </Pressable>
          )}
        </View>
      </FadeIn>

      {/* ── Tampilan Hasil Pencarian ATAU Daftar Modul ── */}
      {searchQuery.trim().length > 0 ? (
        <View style={{ marginTop: 14 }}>
          {/* Header Hasil */}
          <View style={st.searchHeaderRow}>
            <Text style={st.searchHeaderTitle}>
              HASIL PENCARIAN ({searchResults.length} BAB DITEMUKAN)
            </Text>
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={st.searchResetText}>Reset</Text>
            </Pressable>
          </View>

          {searchResults.length === 0 ? (
            <FadeIn delay={50}>
              <Card style={{ alignItems: 'center', paddingVertical: 28, marginTop: 8 }}>
                <Ionicons name="search-outline" size={32} color="rgba(255,255,255,0.2)" />
                <Text style={[st.title, { marginTop: 12, textAlign: 'center' }]}>Tidak ada materi ditemukan</Text>
                <Text style={[st.sub, { textAlign: 'center', marginTop: 4, paddingHorizontal: 16 }]}>
                  Tidak ada bab atau subbab yang memuat kata kunci "{searchQuery}". Coba kata kunci seperti: pair, pip, lot, leverage, candlestick.
                </Text>
              </Card>
            </FadeIn>
          ) : (
            <View style={{ gap: 10, marginTop: 8 }}>
              {searchResults.map((item, idx) => {
                const isCompleted = !!completed[item.lessonId];
                return (
                  <FadeIn key={item.lessonId} delay={60 + idx * 40}>
                    <Card
                      onPress={() => {
                        tap('select');
                        nav.push({ name: 'lesson', params: { moduleId: item.moduleId, lessonId: item.lessonId } });
                      }}
                      style={{ paddingVertical: 14 }}
                    >
                      {/* Lokasi Bab: Di Modul mana & Bab berapa */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                          <Chip label={`Modul ${item.moduleIndex}`} color={levelColor(item.moduleLevel)} />
                          <Text style={st.meta} numberOfLines={1}>
                            Bab {item.lessonIndex} · {item.moduleTitle}
                          </Text>
                        </View>
                        {isCompleted && <Chip label="Selesai" color={colors.green} />}
                      </View>

                      {/* Judul Bab */}
                      <Text style={[st.title, { fontSize: 15 }]}>{item.lessonTitle}</Text>

                      {/* Subbab Match Badge atau Cuplikan */}
                      {item.matchedSubbab && (
                        <View style={st.subbabBadge}>
                          <Ionicons name="bookmark" size={11} color={colors.gold} />
                          <Text style={st.subbabBadgeText} numberOfLines={1}>
                            Subbab: <Text style={{ fontFamily: fonts.bold }}>{item.matchedSubbab}</Text>
                          </Text>
                        </View>
                      )}

                      {item.snippet && (
                        <Text style={st.snippetText} numberOfLines={2}>
                          "{item.snippet}"
                        </Text>
                      )}

                      {/* Footer Meta */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={st.sub}>
                            <Ionicons name="time-outline" size={12} color={colors.muted} /> {item.minutes} menit baca
                          </Text>
                          {item.hasVideo && (
                            <View style={st.videoBadge}>
                              <Ionicons name="logo-youtube" size={10} color={colors.red} />
                              <Text style={st.videoBadgeText}>Video</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Text style={[st.meta, { color: colors.gold }]}>Baca Bab</Text>
                          <Ionicons name="chevron-forward" size={14} color={colors.gold} />
                        </View>
                      </View>
                    </Card>
                  </FadeIn>
                );
              })}
            </View>
          )}
        </View>
      ) : (
        /* ── Daftar Modul ── */
        <View style={{ gap: 12, marginTop: 18 }}>
          {modules.map((m, i) => {
            const d = m.lessons.filter((l) => completed[l.id]).length;
            const lessonCount = m.lessons.length;
            return (
              <FadeIn key={m.id} delay={120 + i * 80}>
                <Card onPress={() => nav.push({ name: 'module', params: { moduleId: m.id } })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconBadge name={m.icon} box={52} size={24} solid={lessonCount > 0 && d === lessonCount} />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Chip label={m.level} color={levelColor(m.level)} />
                        <Text style={st.meta}>Modul {i + 1}</Text>
                      </View>
                      <Text style={st.title}>{m.title}</Text>
                      <Text style={st.sub}>{m.subtitle}</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                    <View style={{ flex: 1 }}>
                      <AnimatedBar value={lessonCount ? d / lessonCount : 0} delay={300 + i * 80} />
                    </View>
                    <Text style={st.progressText}>
                      {d}/{lessonCount}
                    </Text>
                  </View>
                </Card>
              </FadeIn>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   2. MODULE SCREEN (Daftar Bab / Timeline Pelajaran)
   ═══════════════════════════════════════════════════════════════════════ */
export function ModuleScreen({ moduleId }: { moduleId: string }) {
  const nav = useNav();
  const { completed } = useStore();
  const { findModule, refreshing, refresh } = useEdu();
  const [moduleSearch, setModuleSearch] = useState('');

  // Otomatis refresh saat user masuk ke halaman modul / daftar bab
  useEffect(() => {
    refresh(true);
  }, [refresh]);

  const m = findModule(moduleId);

  if (!m) {
    return (
      <Screen title="Modul tidak ditemukan">
        <View />
      </Screen>
    );
  }

  const nextIdx = m.lessons.findIndex((l) => !completed[l.id]);

  // Filter lessons inside module
  const displayedLessons = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return m.lessons;
    return m.lessons.filter((l) => {
      if (l.title.toLowerCase().includes(q)) return true;
      if (l.content && l.content.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [m.lessons, moduleSearch]);

  return (
    <Screen
      title={m.title}
      eyebrow={m.level.toUpperCase()}
      subtitle={m.subtitle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => refresh(true)}
          tintColor={colors.gold}
          colors={[colors.gold]}
          progressBackgroundColor={colors.card}
        />
      }
    >
      {/* ── Search Bar Input dalam Modul jika bab >= 3 ── */}
      {m.lessons.length >= 3 && (
        <FadeIn delay={60}>
          <View style={[st.searchBox, { marginTop: 0, marginBottom: 14 }]}>
            <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
            <TextInput
              value={moduleSearch}
              onChangeText={setModuleSearch}
              placeholder={`Cari dalam ${m.title}...`}
              placeholderTextColor="rgba(255,255,255,0.25)"
              selectionColor={colors.gold}
              autoCorrect={false}
              returnKeyType="search"
              style={st.searchInput}
            />
            {moduleSearch.length > 0 && (
              <Pressable onPress={() => setModuleSearch('')} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
              </Pressable>
            )}
          </View>
        </FadeIn>
      )}

      {/* ── Timeline Bab ── */}
      <View>
        {displayedLessons.map((l, i) => {
          const originalIdx = m.lessons.findIndex((orig) => orig.id === l.id);
          const done = !!completed[l.id];
          const isNext = originalIdx === nextIdx;
          const last = i === displayedLessons.length - 1;
          const hasVideo = !!((l.youtubeUrls && l.youtubeUrls.length > 0) || extractYouTubeId(l.content || '') || (l.content || '').split('\n').some(isDirectVideoUrl));

          return (
            <FadeIn key={l.id} delay={80 + i * 70} from="right">
              <View style={{ flexDirection: 'row' }}>
                {/* Timeline node & line */}
                <View style={{ width: 36, alignItems: 'center' }}>
                  <View style={[st.node, done && st.nodeDone, isNext && st.nodeNext]}>
                    {done ? (
                      <Ionicons name="checkmark" size={16} color={colors.ink} />
                    ) : (
                      <Text style={[st.nodeText, isNext && { color: colors.gold }]}>{originalIdx + 1}</Text>
                    )}
                  </View>
                  {!last && <View style={[st.line, done && { backgroundColor: colors.gold }]} />}
                </View>

                {/* Card Lesson */}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                          <Text style={st.sub}>
                            <Ionicons name="time-outline" size={12} color={colors.muted} /> {l.minutes} menit baca
                          </Text>
                          {hasVideo ? (
                            <View style={st.videoBadge}>
                              <Ionicons name="logo-youtube" size={10} color={colors.red} />
                              <Text style={st.videoBadgeText}>
                                {l.youtubeUrls!.length > 1 ? `${l.youtubeUrls!.length} Video` : 'Video'}
                              </Text>
                            </View>
                          ) : null}
                        </View>
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

/* ═══════════════════════════════════════════════════════════════════════
   3. LESSON SCREEN (Halaman Baca Materi & Nonton Video)
   ═══════════════════════════════════════════════════════════════════════ */
export function LessonScreen({ moduleId, lessonId }: { moduleId: string; lessonId: string }) {
  const nav = useNav();
  const { completed, toggleLesson } = useStore();
  const { findLesson, refresh } = useEdu();

  // Otomatis refresh saat user masuk ke bab materi agar subbab & konten selalu terupdate
  useEffect(() => {
    refresh(true);
  }, [refresh]);

  // Indikator selesai singkat sebelum berpindah layar; aksi navigasi ditahan sampai animasi usai
  const [pulse, setPulse] = useState<{ visible: boolean; label: string }>({ visible: false, label: '' });
  const pendingAction = useRef<(() => void) | null>(null);

  const finishThen = (celebrate: boolean, label: string, action: () => void) => {
    if (pulse.visible) return;
    tap('success');
    if (!celebrate) {
      action();
      return;
    }
    pendingAction.current = action;
    setPulse({ visible: true, label });
  };

  const handlePulseDone = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setPulse({ visible: false, label: '' });
    action?.();
  };

  const found = findLesson(moduleId, lessonId);
  if (!found) {
    return (
      <Screen title="Materi tidak ditemukan">
        <View />
      </Screen>
    );
  }

  const { module: m, lesson, index: idx } = found;
  const next = m.lessons[idx + 1];
  const done = !!completed[lesson.id];

  // Deteksi video YouTube yang BELUM disisipkan di dalam teks naskah
  const unplacedVideos = useMemo(() => {
    if (!lesson.youtubeUrls || lesson.youtubeUrls.length === 0) return [];
    const content = lesson.content || '';
    return lesson.youtubeUrls.filter((url) => {
      const ytid = extractYouTubeId(url);
      if (!ytid) return false;
      return !content.includes(ytid) && !content.includes(url);
    });
  }, [lesson.youtubeUrls, lesson.content]);

  return (
    <Screen title={lesson.title} eyebrow={`${m.title.toUpperCase()} · BAB ${idx + 1}/${m.lessons.length}`}>
      {/* ── Meta ── */}
      <FadeIn delay={80}>
        <View style={st.metaRow}>
          <Chip label={`${lesson.minutes} menit`} color={colors.textDim} />
          {done && <Chip label="Selesai" color={colors.green} />}
        </View>

        <View style={{ marginBottom: 12 }}>
          <AnimatedBar value={(idx + (done ? 1 : 0)) / m.lessons.length} height={4} />
        </View>
      </FadeIn>

      {/* ── YouTube Player Top Section (HANYA bila ada video legacy yang BELUM disisipkan di dalam naskah) ── */}
      {unplacedVideos.length > 0 ? (
        <FadeIn delay={120}>
          <View style={{ marginBottom: 14 }}>
            {unplacedVideos.map((url, vIdx) => (
              <YouTubePlayer
                key={vIdx}
                url={url}
                title={unplacedVideos.length > 1 ? `Video Penjelasan ${vIdx + 1}` : 'Video Penjelasan Materi'}
              />
            ))}
          </View>
        </FadeIn>
      ) : null}

      {/* ── Teks Materi Berformat Terintegrasi dengan Foto & Video Inline Sesuai Peletakan ── */}
      <FadeIn delay={160}>
        <RichText content={lesson.content} />
      </FadeIn>

      {/* ── Tombol Selesai & Lanjut ── */}
      <View style={{ marginTop: 28, gap: 10 }}>
        {next ? (
          <GoldButton
            title={done ? 'Materi berikutnya' : 'Selesai & lanjut'}
            icon="arrow-forward"
            onPress={() =>
              finishThen(!done, 'Bab selesai', () => {
                toggleLesson(lesson.id, true);
                nav.pop();
                nav.push({ name: 'lesson', params: { moduleId: m.id, lessonId: next.id } });
              })
            }
          />
        ) : (
          !done && (
            <GoldButton
              title="Tandai modul selesai"
              icon="trophy"
              onPress={() =>
                finishThen(true, 'Modul selesai', () => {
                  toggleLesson(lesson.id, true);
                  nav.pop();
                })
              }
            />
          )
        )}
        {done ? <GoldButton title="Tandai belum selesai" variant="outline" onPress={() => toggleLesson(lesson.id, false)} /> : null}
      </View>

      <CompletionPulse visible={pulse.visible} label={pulse.label} onDone={handlePulseDone} />
    </Screen>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   4. RICH TEXT PARSER (Render Heading, Bullet, Catatan Emas, Foto & Video Inline)
   ═══════════════════════════════════════════════════════════════════════ */

function formatInlineTextRN(text: string, baseStyle?: any) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`t-${lastIndex}`} style={baseStyle}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }
    const token = match[0];
    const key = `m-${match.index}`;

    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <Text key={key} style={[baseStyle, { fontFamily: fonts.bold, color: colors.text }]}>
          {token.slice(2, -2)}
        </Text>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <Text key={key} style={[baseStyle, { fontFamily: fonts.medium, fontStyle: 'italic', color: colors.goldLight }]}>
          {token.slice(1, -1)}
        </Text>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <Text
          key={key}
          style={[
            baseStyle,
            {
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
              color: colors.gold,
              backgroundColor: 'rgba(237,193,58,0.12)',
              fontSize: 14,
            },
          ]}
        >
          {` ${token.slice(1, -1)} `}
        </Text>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        parts.push(
          <Text
            key={key}
            onPress={() => Linking.openURL(linkUrl).catch(() => {})}
            style={[baseStyle, { color: colors.gold, textDecorationLine: 'underline', fontFamily: fonts.semi }]}
          >
            {linkText}
          </Text>
        );
      } else {
        parts.push(<Text key={key} style={baseStyle}>{token}</Text>);
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <Text key={`t-${lastIndex}`} style={baseStyle}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return parts.length > 0 ? parts : <Text style={baseStyle}>{text}</Text>;
}

/**
 * Foto materi dengan rasio mengikuti gambar asli. Rasio dibatasi 1:1 sampai 2:1 agar foto tegak
 * tidak terlalu tinggi dan foto sangat lebar tidak terlalu pipih, tanpa ruang kosong mencolok.
 */
function AdaptiveImage({ uri }: { uri: string }) {
  const [ratio, setRatio] = useState(16 / 9);

  useEffect(() => {
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (alive && w > 0 && h > 0) setRatio(Math.min(2, Math.max(1, w / h)));
      },
      () => {
        /* gagal membaca ukuran: pertahankan rasio bawaan */
      }
    );
    return () => {
      alive = false;
    };
  }, [uri]);

  return <Image source={{ uri }} style={[st.imageImg, { aspectRatio: ratio }]} resizeMode="contain" />;
}

export function RichText({ content }: { content: string }) {
  const [lightboxImg, setLightboxImg] = useState<{ url: string; caption?: string } | null>(null);

  if (!content || !content.trim()) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontStyle: 'italic', fontFamily: fonts.medium }}>
          Belum ada materi tertulis.
        </Text>
      </View>
    );
  }

  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let tipLines: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushPara = (key: string) => {
    if (para.length) {
      blocks.push(
        <Text key={key} style={st.p}>
          {formatInlineTextRN(para.join(' '), st.p)}
        </Text>
      );
      para = [];
    }
  };

  const flushTip = (key: string) => {
    if (tipLines.length) {
      blocks.push(
        <LinearGradient
          key={key}
          colors={['rgba(237,193,58,0.16)', 'rgba(237,193,58,0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.tip}
        >
          <View style={st.tipIcon}>
            <Ionicons name="bulb" size={16} color={colors.ink} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            {tipLines.map((tLine, tIdx) => (
              <Text key={tIdx} style={[st.p, { marginBottom: 0, color: colors.text, fontFamily: fonts.medium }]}>
                {formatInlineTextRN(tLine, { color: colors.text, fontFamily: fonts.medium })}
              </Text>
            ))}
          </View>
        </LinearGradient>
      );
      tipLines = [];
    }
  };

  const flushCode = (key: string) => {
    if (codeLines.length) {
      blocks.push(
        <View key={key} style={st.codeBox}>
          <Text style={st.codeText}>{codeLines.join('\n')}</Text>
        </View>
      );
      codeLines = [];
    }
  };

  const flushAll = (keyPrefix: string) => {
    flushPara(keyPrefix + '-p');
    flushTip(keyPrefix + '-tip');
    flushCode(keyPrefix + '-code');
  };

  const lines = content.split('\n');

  lines.forEach((raw, i) => {
    const trimmed = raw.trim();

    // 1. Blok Kode ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCode('code-' + i);
      } else {
        flushAll('before-code-' + i);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(raw);
      return;
    }

    // 2. Baris Kosong
    if (!trimmed) {
      flushAll('blank-' + i);
      return;
    }

    // 3. Catatan / Tips (> )
    if (trimmed.startsWith('> ')) {
      flushPara('pre-tip-' + i);
      tipLines.push(trimmed.slice(2).trim());
      return;
    } else if (tipLines.length > 0) {
      flushTip('tip-' + i);
    }

    // 4. Garis Pembatas (--- atau ***)
    if (trimmed === '---' || trimmed === '***') {
      flushAll('div-' + i);
      blocks.push(<View key={'div-' + i} style={st.dividerLine} />);
      return;
    }

    // 5. Foto / Gambar Inline
    // Format: ![caption](url) atau [foto: url] atau [gambar: url] atau data:image atau direct image link
    const imgMdMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    const imgTagMatch = trimmed.match(/^\[(?:foto|gambar|image|img)(?::|\s+)(.*?)\]$/i);
    const isDirectImgUrl =
      /^(https?:\/\/.*?\.(?:png|jpg|jpeg|webp|gif|svg|avif|bmp)(?:\?.*)?)$/i.test(trimmed) ||
      /^data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml|bmp|avif);base64,/i.test(trimmed);

    let imgSrc: string | null = null;
    let imgCaption = '';

    if (imgMdMatch) {
      imgCaption = imgMdMatch[1].trim();
      imgSrc = imgMdMatch[2].trim();
    } else if (imgTagMatch) {
      imgSrc = imgTagMatch[1].trim();
    } else if (isDirectImgUrl) {
      imgSrc = trimmed;
    }

    if (imgSrc) {
      flushAll('img-pre-' + i);
      const currentSrc = imgSrc;
      const currentCaption = imgCaption;
      blocks.push(
        <View key={'inline-img-' + i} style={st.imageCard}>
          <Pressable
            onPress={() => setLightboxImg({ url: currentSrc, caption: currentCaption })}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
          >
            <AdaptiveImage uri={currentSrc} />
          </Pressable>
          {currentCaption ? (
            <Pressable
              onPress={() => setLightboxImg({ url: currentSrc, caption: currentCaption })}
              style={st.imageCaptionRow}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons name="camera-outline" size={14} color={colors.gold} />
                <Text style={st.imageCaptionText} numberOfLines={2}>
                  {currentCaption}
                </Text>
              </View>
              <Text style={st.zoomHintText}>Perbesar</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setLightboxImg({ url: currentSrc, caption: currentCaption })}
              style={[st.imageCaptionRow, { justifyContent: 'flex-end' }]}
            >
              <Text style={st.zoomHintText}>Ketuk untuk perbesar</Text>
            </Pressable>
          )}
        </View>
      );
      return;
    }

    // 6. Video YouTube Inline
    // Format: [VIDEO: ... | url="..." | id="..."], [video: url], [video](url), atau URL YouTube langsung
    const videoEmbedMatch = trimmed.match(/^\[(?:VIDEO|video):\s*(.*?)(?:\s*\|\s*url=["'](.*?)["'])?(?:\s*\|\s*id=["'](.*?)["'])?\]$/i);
    const ytTagMatch =
      trimmed.match(/^\[video(?::|\s+)(.*?)\]$/i) ||
      trimmed.match(/^!?\[(?:video|youtube)\]\((.*?)\)$/i);
    const potentialYtUrl = videoEmbedMatch && videoEmbedMatch[2]
      ? videoEmbedMatch[2].trim()
      : videoEmbedMatch && videoEmbedMatch[1] && (videoEmbedMatch[1].startsWith('http') || extractYouTubeId(videoEmbedMatch[1]))
      ? videoEmbedMatch[1].trim()
      : ytTagMatch
      ? ytTagMatch[1].trim()
      : trimmed;
    const inlineYtId = extractYouTubeId(potentialYtUrl);

    // Video berkas unggahan admin (MP4/WebM)
    if (isDirectVideoUrl(potentialYtUrl)) {
      flushAll('vf-pre-' + i);
      blocks.push(
        <View key={'inline-vf-' + i} style={{ marginVertical: 8 }}>
          <VideoFilePlayer url={potentialYtUrl} title="Video Pembelajaran Materi" />
        </View>
      );
      return;
    }

    if (inlineYtId && (videoEmbedMatch || ytTagMatch || potentialYtUrl.startsWith('http://') || potentialYtUrl.startsWith('https://'))) {
      flushAll('yt-pre-' + i);
      blocks.push(
        <View key={'inline-yt-' + i} style={{ marginVertical: 8 }}>
          <YouTubePlayer url={potentialYtUrl} title="Video Pembelajaran Materi" />
        </View>
      );
      return;
    }

    // 7. Heading 1 (# Judul)
    if (trimmed.startsWith('# ')) {
      flushAll('h1-pre-' + i);
      blocks.push(
        <View key={i} style={st.h1Row}>
          <View style={st.h1Bar} />
          <Text style={st.h1}>{trimmed.slice(2)}</Text>
        </View>
      );
      return;
    }

    // 8. Heading 2 (## Subjudul)
    if (trimmed.startsWith('## ')) {
      flushAll('h2-pre-' + i);
      blocks.push(
        <View key={i} style={st.h2Row}>
          <View style={st.h2Bar} />
          <Text style={st.h2}>{trimmed.slice(3)}</Text>
        </View>
      );
      return;
    }

    // 9. Heading 3 (### Subjudul Kecil)
    if (trimmed.startsWith('### ')) {
      flushAll('h3-pre-' + i);
      blocks.push(
        <Text key={i} style={st.h3}>
          {trimmed.slice(4)}
        </Text>
      );
      return;
    }

    // 10. Numbered List (1. Poin)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      flushAll('num-pre-' + i);
      blocks.push(
        <View key={i} style={st.bulletRow}>
          <View style={st.numBadge}>
            <Text style={st.numBadgeText}>{numMatch[1]}</Text>
          </View>
          <Text style={[st.p, { flex: 1, marginBottom: 8 }]}>
            {formatInlineTextRN(numMatch[2], st.p)}
          </Text>
        </View>
      );
      return;
    }

    // 11. Bullet List (- Poin atau * Poin)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushAll('bullet-pre-' + i);
      blocks.push(
        <View key={i} style={st.bulletRow}>
          <View style={st.bullet} />
          <Text style={[st.p, { flex: 1, marginBottom: 8 }]}>
            {formatInlineTextRN(trimmed.slice(2), st.p)}
          </Text>
        </View>
      );
      return;
    }

    // Default: Baris teks paragraf biasa
    para.push(trimmed);
  });

  flushAll('end');

  return (
    <View>
      {blocks}

      {/* Lightbox Modal (Zoom Foto Layar Penuh) */}
      {lightboxImg && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setLightboxImg(null)}
        >
          <View style={st.lightboxBackdrop}>
            <Pressable
              style={st.lightboxCloseBtn}
              onPress={() => setLightboxImg(null)}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </Pressable>
            <View style={st.lightboxCenter}>
              <Image
                source={{ uri: lightboxImg.url }}
                style={st.lightboxImg}
                resizeMode="contain"
              />
              {lightboxImg.caption ? (
                <View style={st.lightboxCaptionBox}>
                  <Ionicons name="camera-outline" size={16} color={colors.gold} style={{ marginRight: 6 }} />
                  <Text style={st.lightboxCaptionText}>{lightboxImg.caption}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   5. STYLES
   ═══════════════════════════════════════════════════════════════════════ */
const st = StyleSheet.create({
  ringText: { color: colors.goldLight, fontFamily: fonts.display, fontSize: 15 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, letterSpacing: -0.2 },
  sub: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, marginTop: 3 },
  meta: { color: colors.muted, fontFamily: fonts.semi, fontSize: 12 },
  progressText: { color: colors.gold, fontFamily: fonts.bold, fontSize: 12, marginLeft: 10 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    marginTop: 14,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 13,
    padding: 0,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  searchHeaderTitle: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  searchResetText: {
    color: colors.gold,
    fontFamily: fonts.semi,
    fontSize: 12,
  },
  subbabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(237,193,58,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(237,193,58,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  subbabBadgeText: {
    color: colors.goldLight,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  snippetText: {
    color: colors.textDim,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    fontStyle: 'italic',
  },

  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(235,87,87,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  videoBadgeText: {
    color: colors.red,
    fontFamily: fonts.semi,
    fontSize: 10,
  },

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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  h2Row: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  h2Bar: { width: 4, height: 20, borderRadius: 2, backgroundColor: colors.gold, marginRight: 10 },
  h2: { color: colors.text, fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.3, flex: 1 },
  p: { color: colors.textDim, fontFamily: fonts.body, fontSize: 16, lineHeight: 27, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 2 },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginTop: 10,
    marginRight: 12,
    transform: [{ rotate: '45deg' }],
  },
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
  h1Row: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  h1Bar: { width: 5, height: 24, borderRadius: 2.5, backgroundColor: colors.gold, marginRight: 10 },
  h1: { color: colors.text, fontFamily: fonts.display, fontSize: 22, letterSpacing: -0.3, flex: 1 },
  h3: { color: colors.goldLight, fontFamily: fonts.bold, fontSize: 16, marginTop: 16, marginBottom: 8 },
  numBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(237,193,58,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(237,193,58,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 3,
  },
  numBadgeText: { color: colors.gold, fontFamily: fonts.bold, fontSize: 11 },
  codeBox: {
    backgroundColor: '#0a0d14',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  codeText: {
    color: colors.goldLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 18,
  },
  imageCard: {
    marginVertical: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#07090E',
    borderWidth: 1,
    borderColor: 'rgba(227, 182, 79, 0.25)',
  },
  imageImg: {
    width: '100%',
    backgroundColor: '#05070A',
  },
  imageCaptionRow: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(18, 22, 32, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageCaptionText: {
    color: colors.textDim,
    fontFamily: fonts.medium,
    fontStyle: 'italic',
    fontSize: 12,
    flex: 1,
  },
  zoomHintText: {
    color: colors.muted,
    fontFamily: fonts.semi,
    fontSize: 11,
    marginLeft: 8,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCenter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImg: {
    width: '100%',
    height: 380,
  },
  lightboxCaptionBox: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '90%',
  },
  lightboxCaptionText: {
    color: '#FFF',
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: 'center',
  },
});
