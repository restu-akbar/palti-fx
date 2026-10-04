import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ConfirmDeleteModal,
  LessonEditorModal,
  ModuleEditorModal,
} from '../components/EduEditorModals';
import { AnimatedBar, FadeIn, ProgressRing, tap } from '../components/motion';
import { Card, Chip, GoldButton, IconBadge, Screen } from '../components/ui';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { useEdu } from '../context/EduContext';
import { Lesson, Module } from '../data/modules';
import { EduService } from '../lib/eduService';
import { useStore } from '../lib/store';
import { useNav } from '../nav';
import { colors, fonts } from '../theme';

const levelColor = (l: Module['level']) =>
  l === 'Pemula' ? colors.green : l === 'Menengah' ? colors.gold : colors.red;

/* ═══════════════════════════════════════════════════════════════════════
   1. EDU SCREEN (Daftar Seluruh Modul)
   ═══════════════════════════════════════════════════════════════════════ */
export function EduScreen() {
  const nav = useNav();
  const { completed, settings } = useStore();
  const { modules, refresh } = useEdu();

  const isAdmin = settings.role === 'admin';

  // State Editor Modal
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleToEdit, setModuleToEdit] = useState<Module | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Hitung total lesson secara dinamis
  const allLessons = modules.flatMap((m) => m.lessons);
  const done = allLessons.filter((l) => completed[l.id]).length;
  const total = allLessons.length;

  const handleOpenAddModule = () => {
    tap('select');
    setModuleToEdit(null);
    setShowModuleModal(true);
  };

  const handleOpenEditModule = (m: Module) => {
    tap('select');
    setModuleToEdit(m);
    setShowModuleModal(true);
  };

  const handleSaveModule = async (data: {
    title: string;
    subtitle: string;
    level: Module['level'];
    icon: Module['icon'];
  }) => {
    if (moduleToEdit) {
      const res = await EduService.updateModule(moduleToEdit.id, data);
      if (!res.success) {
        Alert.alert('Gagal', res.error || 'Gagal memperbarui modul.');
        return;
      }
    } else {
      const res = await EduService.createModule(data);
      if (!res.success) {
        Alert.alert('Gagal', res.error || 'Gagal menambahkan modul.');
        return;
      }
    }
    await refresh();
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return;
    setDeleting(true);
    const res = await EduService.deleteModule(moduleToDelete.id);
    setDeleting(false);
    if (!res.success) {
      Alert.alert('Gagal', res.error || 'Gagal menghapus modul.');
      return;
    }
    setModuleToDelete(null);
    await refresh();
  };

  const handleMoveModule = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= modules.length) return;
    tap('select');
    const reordered = [...modules];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    await EduService.reorderModules(reordered.map((m) => m.id));
    await refresh();
  };

  return (
    <Screen title="Edukasi" eyebrow="AKADEMI PALTI FX" subtitle="Belajar bertahap dari dasar sampai mahir">
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

      {/* ── Admin Control Bar ── */}
      {isAdmin ? (
        <FadeIn delay={100}>
          <View style={st.adminBar}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="shield-checkmark" size={14} color={colors.gold} />
                <Text style={st.adminBarTitle}>Panel Admin Materi</Text>
              </View>
              <Text style={st.adminBarSub}>Kelola modul & kurikulum langsung dari HP</Text>
            </View>
            <Pressable onPress={handleOpenAddModule} style={st.adminAddBtn} hitSlop={8}>
              <Ionicons name="add" size={16} color={colors.ink} />
              <Text style={st.adminAddBtnText}>Modul</Text>
            </Pressable>
          </View>
        </FadeIn>
      ) : null}

      {/* ── Daftar Modul ── */}
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

                {/* Action Bar Khusus Admin */}
                {isAdmin ? (
                  <View style={st.cardAdminRow}>
                    <View style={st.orderBtns}>
                      <Pressable
                        onPress={() => handleMoveModule(i, -1)}
                        disabled={i === 0}
                        style={[st.iconActionBtn, i === 0 && { opacity: 0.3 }]}
                        hitSlop={6}
                      >
                        <Ionicons name="arrow-up" size={14} color={colors.text} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleMoveModule(i, 1)}
                        disabled={i === modules.length - 1}
                        style={[st.iconActionBtn, i === modules.length - 1 && { opacity: 0.3 }]}
                        hitSlop={6}
                      >
                        <Ionicons name="arrow-down" size={14} color={colors.text} />
                      </Pressable>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable onPress={() => handleOpenEditModule(m)} style={st.editModuleBtn} hitSlop={6}>
                        <Ionicons name="pencil" size={13} color={colors.gold} />
                        <Text style={st.editModuleText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          tap('light');
                          setModuleToDelete(m);
                        }}
                        style={st.deleteModuleBtn}
                        hitSlop={6}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.red} />
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </Card>
            </FadeIn>
          );
        })}
      </View>

      {/* Modals */}
      <ModuleEditorModal
        visible={showModuleModal}
        moduleToEdit={moduleToEdit}
        onClose={() => setShowModuleModal(false)}
        onSave={handleSaveModule}
      />

      <ConfirmDeleteModal
        visible={!!moduleToDelete}
        title="Hapus Modul?"
        message={`Apakah Anda yakin ingin menghapus modul "${moduleToDelete?.title}" beserta seluruh bab di dalamnya? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
        onCancel={() => setModuleToDelete(null)}
        onConfirm={handleDeleteModule}
      />
    </Screen>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   2. MODULE SCREEN (Daftar Bab / Timeline Pelajaran)
   ═══════════════════════════════════════════════════════════════════════ */
export function ModuleScreen({ moduleId }: { moduleId: string }) {
  const nav = useNav();
  const { completed, settings } = useStore();
  const { findModule, refresh } = useEdu();

  const isAdmin = settings.role === 'admin';
  const m = findModule(moduleId);

  // State Editor Modal
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!m) {
    return (
      <Screen title="Modul tidak ditemukan">
        <View />
      </Screen>
    );
  }

  const nextIdx = m.lessons.findIndex((l) => !completed[l.id]);

  const handleOpenAddLesson = () => {
    tap('select');
    setLessonToEdit(null);
    setShowLessonModal(true);
  };

  const handleOpenEditLesson = (l: Lesson) => {
    tap('select');
    setLessonToEdit(l);
    setShowLessonModal(true);
  };

  const handleSaveLesson = async (data: {
    title: string;
    minutes: number;
    youtubeUrls: string[];
    content: string;
  }) => {
    if (lessonToEdit) {
      const res = await EduService.updateLesson(lessonToEdit.id, data);
      if (!res.success) {
        Alert.alert('Gagal', res.error || 'Gagal memperbarui bab.');
        return;
      }
    } else {
      const res = await EduService.createLesson(m.id, data);
      if (!res.success) {
        Alert.alert('Gagal', res.error || 'Gagal menambahkan bab baru.');
        return;
      }
    }
    await refresh();
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;
    setDeleting(true);
    const res = await EduService.deleteLesson(lessonToDelete.id);
    setDeleting(false);
    if (!res.success) {
      Alert.alert('Gagal', res.error || 'Gagal menghapus bab.');
      return;
    }
    setLessonToDelete(null);
    await refresh();
  };

  const handleMoveLesson = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= m.lessons.length) return;
    tap('select');
    const reordered = [...m.lessons];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    await EduService.reorderLessons(reordered.map((l) => l.id));
    await refresh();
  };

  return (
    <Screen title={m.title} eyebrow={m.level.toUpperCase()} subtitle={m.subtitle}>
      {/* ── Admin Action: Tambah Bab ── */}
      {isAdmin ? (
        <FadeIn delay={60}>
          <View style={[st.adminBar, { marginBottom: 16 }]}>
            <View style={{ flex: 1 }}>
              <Text style={st.adminBarTitle}>Kelola Bab Modul Ini</Text>
              <Text style={st.adminBarSub}>{m.lessons.length} bab terdaftar dalam kurikulum</Text>
            </View>
            <Pressable onPress={handleOpenAddLesson} style={st.adminAddBtn} hitSlop={8}>
              <Ionicons name="add" size={16} color={colors.ink} />
              <Text style={st.adminAddBtnText}>Bab Baru</Text>
            </Pressable>
          </View>
        </FadeIn>
      ) : null}

      {/* ── Timeline Bab ── */}
      <View>
        {m.lessons.map((l, i) => {
          const done = !!completed[l.id];
          const isNext = i === nextIdx;
          const last = i === m.lessons.length - 1;
          const hasVideo = l.youtubeUrls && l.youtubeUrls.length > 0;

          return (
            <FadeIn key={l.id} delay={80 + i * 70} from="right">
              <View style={{ flexDirection: 'row' }}>
                {/* Timeline node & line */}
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

                    {/* Action Bar Khusus Admin pada Tiap Bab */}
                    {isAdmin ? (
                      <View style={[st.cardAdminRow, { marginTop: 10, paddingTop: 10 }]}>
                        <View style={st.orderBtns}>
                          <Pressable
                            onPress={() => handleMoveLesson(i, -1)}
                            disabled={i === 0}
                            style={[st.iconActionBtn, i === 0 && { opacity: 0.3 }]}
                            hitSlop={6}
                          >
                            <Ionicons name="arrow-up" size={13} color={colors.text} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleMoveLesson(i, 1)}
                            disabled={i === m.lessons.length - 1}
                            style={[st.iconActionBtn, i === m.lessons.length - 1 && { opacity: 0.3 }]}
                            hitSlop={6}
                          >
                            <Ionicons name="arrow-down" size={13} color={colors.text} />
                          </Pressable>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Pressable onPress={() => handleOpenEditLesson(l)} style={st.editModuleBtn} hitSlop={6}>
                            <Ionicons name="pencil" size={12} color={colors.gold} />
                            <Text style={st.editModuleText}>Edit</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              tap('light');
                              setLessonToDelete(l);
                            }}
                            style={st.deleteModuleBtn}
                            hitSlop={6}
                          >
                            <Ionicons name="trash-outline" size={13} color={colors.red} />
                          </Pressable>
                        </View>
                      </View>
                    ) : null}
                  </Card>
                </View>
              </View>
            </FadeIn>
          );
        })}
      </View>

      {/* Modals */}
      <LessonEditorModal
        visible={showLessonModal}
        moduleId={m.id}
        lessonToEdit={lessonToEdit}
        onClose={() => setShowLessonModal(false)}
        onSave={handleSaveLesson}
      />

      <ConfirmDeleteModal
        visible={!!lessonToDelete}
        title="Hapus Bab Materi?"
        message={`Apakah Anda yakin ingin menghapus bab "${lessonToDelete?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
        onCancel={() => setLessonToDelete(null)}
        onConfirm={handleDeleteLesson}
      />
    </Screen>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   3. LESSON SCREEN (Halaman Baca Materi & Nonton Video)
   ═══════════════════════════════════════════════════════════════════════ */
export function LessonScreen({ moduleId, lessonId }: { moduleId: string; lessonId: string }) {
  const nav = useNav();
  const { completed, toggleLesson, settings } = useStore();
  const { findLesson, refresh } = useEdu();

  const isAdmin = settings.role === 'admin';
  const found = findLesson(moduleId, lessonId);

  const [showEditModal, setShowEditModal] = useState(false);

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

  const handleSaveLesson = async (data: {
    title: string;
    minutes: number;
    youtubeUrls: string[];
    content: string;
  }) => {
    const res = await EduService.updateLesson(lesson.id, data);
    if (!res.success) {
      Alert.alert('Gagal', res.error || 'Gagal memperbarui bab.');
      return;
    }
    await refresh();
  };

  return (
    <Screen title={lesson.title} eyebrow={`${m.title.toUpperCase()} · BAB ${idx + 1}/${m.lessons.length}`}>
      {/* ── Meta & Admin Shortcut ── */}
      <FadeIn delay={80}>
        <View style={st.metaRow}>
          <Chip label={`${lesson.minutes} menit`} color={colors.textDim} />
          {done && <Chip label="Selesai" color={colors.green} />}
          {isAdmin ? (
            <Pressable onPress={() => setShowEditModal(true)} style={st.adminEditLessonBtn} hitSlop={6}>
              <Ionicons name="pencil" size={13} color={colors.gold} />
              <Text style={st.adminEditLessonText}>Edit Bab Ini</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={{ marginBottom: 12 }}>
          <AnimatedBar value={(idx + (done ? 1 : 0)) / m.lessons.length} height={4} />
        </View>
      </FadeIn>

      {/* ── Video Player YouTube (Jika Ada) ── */}
      {lesson.youtubeUrls && lesson.youtubeUrls.length > 0 ? (
        <FadeIn delay={120}>
          <View style={{ marginBottom: 14 }}>
            {lesson.youtubeUrls.map((url, vIdx) => (
              <YouTubePlayer
                key={vIdx}
                url={url}
                title={lesson.youtubeUrls!.length > 1 ? `Video Penjelasan ${vIdx + 1}` : 'Video Penjelasan Materi'}
              />
            ))}
          </View>
        </FadeIn>
      ) : null}

      {/* ── Teks Materi Berformat ── */}
      <FadeIn delay={160}>
        <RichText content={lesson.content} />
      </FadeIn>

      {/* ── Tombol Selesai & Lanjut ── */}
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

      {/* Modal Edit Khusus Admin */}
      <LessonEditorModal
        visible={showEditModal}
        moduleId={m.id}
        lessonToEdit={lesson}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveLesson}
      />
    </Screen>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   4. RICH TEXT PARSER (Render Heading, Bullet, Catatan Emas)
   ═══════════════════════════════════════════════════════════════════════ */
export function RichText({ content }: { content: string }) {
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  const flush = (key: string) => {
    if (para.length) {
      blocks.push(
        <Text key={key} style={st.p}>
          {para.join(' ')}
        </Text>
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
        </View>
      );
    } else if (line.startsWith('- ')) {
      flush('p' + i);
      blocks.push(
        <View key={i} style={st.bulletRow}>
          <View style={st.bullet} />
          <Text style={[st.p, { flex: 1, marginBottom: 8 }]}>{line.slice(2)}</Text>
        </View>
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
        </LinearGradient>
      );
    } else {
      para.push(line);
    }
  });
  flush('end');
  return <View>{blocks}</View>;
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

  adminBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(237,193,58,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(237,193,58,0.22)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  adminBarTitle: {
    color: colors.gold,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  adminBarSub: {
    color: colors.textDim,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 1,
  },
  adminAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminAddBtnText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
  },

  cardAdminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
    marginTop: 12,
  },
  orderBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(237,193,58,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(237,193,58,0.2)',
  },
  editModuleText: {
    color: colors.gold,
    fontFamily: fonts.semi,
    fontSize: 11.5,
  },
  deleteModuleBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(235,87,87,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  adminEditLessonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: 'rgba(237,193,58,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(237,193,58,0.25)',
  },
  adminEditLessonText: {
    color: colors.gold,
    fontFamily: fonts.semi,
    fontSize: 11.5,
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
});
