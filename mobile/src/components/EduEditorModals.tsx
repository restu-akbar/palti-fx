import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PressScale, tap } from './motion';
import { Lesson, Module } from '../data/modules';
import { colors, fonts, goldGradient } from '../theme';

/* ─── MODAL KONFIRMASI HAPUS ─── */
export function ConfirmDeleteModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  loading = false,
}: {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={st.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={st.modalDimmer} />
        </Pressable>

        <BlurView intensity={Platform.OS === 'ios' ? 30 : 20} tint="dark" style={st.modalCard}>
          <View style={st.deleteIconWrap}>
            <Ionicons name="trash-outline" size={24} color={colors.red} />
          </View>
          <Text style={st.modalTitle}>{title}</Text>
          <Text style={st.modalDesc}>{message}</Text>

          <View style={st.modalBtnRow}>
            <Pressable onPress={onCancel} style={st.modalCancelBtn} disabled={loading}>
              <Text style={st.modalCancelText}>Batal</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PressScale onPress={loading ? undefined : onConfirm}>
                <View style={st.deleteBtn}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={st.deleteBtnText}>Ya, Hapus</Text>
                  )}
                </View>
              </PressScale>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

/* ─── MODAL PERINGATAN UNSAVED CHANGES ─── */
export function UnsavedChangesModal({
  visible,
  onStay,
  onDiscard,
}: {
  visible: boolean;
  onStay: () => void;
  onDiscard: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onStay}>
      <View style={st.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onStay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={st.modalDimmer} />
        </Pressable>

        <BlurView intensity={Platform.OS === 'ios' ? 30 : 20} tint="dark" style={st.modalCard}>
          <View style={[st.deleteIconWrap, { backgroundColor: 'rgba(237,193,58,0.12)' }]}>
            <Ionicons name="warning-outline" size={24} color={colors.gold} />
          </View>
          <Text style={st.modalTitle}>Perubahan Belum Disimpan</Text>
          <Text style={st.modalDesc}>
            Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar dan membuang perubahan ini?
          </Text>

          <View style={st.modalBtnRow}>
            <Pressable onPress={onStay} style={st.modalCancelBtn}>
              <Text style={st.modalCancelText}>Lanjut Mengedit</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PressScale onPress={onDiscard}>
                <View style={[st.deleteBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                  <Text style={[st.deleteBtnText, { color: colors.red }]}>Buang & Keluar</Text>
                </View>
              </PressScale>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

/* ─── MODAL EDITOR MODUL ─── */
export function ModuleEditorModal({
  visible,
  moduleToEdit,
  onClose,
  onSave,
}: {
  visible: boolean;
  moduleToEdit?: Module | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    subtitle: string;
    level: Module['level'];
    icon: Module['icon'];
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [level, setLevel] = useState<Module['level']>('Pemula');
  const [icon, setIcon] = useState<Module['icon']>('school-outline');
  const [loading, setLoading] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  useEffect(() => {
    if (moduleToEdit) {
      setTitle(moduleToEdit.title);
      setSubtitle(moduleToEdit.subtitle);
      setLevel(moduleToEdit.level);
      setIcon(moduleToEdit.icon);
    } else {
      setTitle('');
      setSubtitle('');
      setLevel('Pemula');
      setIcon('school-outline');
    }
  }, [moduleToEdit, visible]);

  const isDirty = moduleToEdit
    ? title !== moduleToEdit.title ||
      subtitle !== moduleToEdit.subtitle ||
      level !== moduleToEdit.level ||
      icon !== moduleToEdit.icon
    : title.trim().length > 0 || subtitle.trim().length > 0;

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSave({ title, subtitle, level, icon });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const iconOptions: Module['icon'][] = [
    'school-outline',
    'shield-checkmark-outline',
    'analytics-outline',
    'bulb-outline',
    'trending-up-outline',
  ];

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleRequestClose}>
        <View style={st.editorOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
            <BlurView intensity={40} tint="dark" style={st.editorSheet}>
              {/* Header */}
              <View style={st.editorHead}>
                <View>
                  <Text style={st.editorTitle}>{moduleToEdit ? 'Edit Modul' : 'Tambah Modul Baru'}</Text>
                  <Text style={st.editorSub}>Kelola kurikulum edukasi untuk member</Text>
                </View>
                <Pressable onPress={handleRequestClose} hitSlop={10} style={st.closeIconBtn}>
                  <Ionicons name="close" size={20} color={colors.textDim} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
                {/* Judul */}
                <View style={st.fieldCol}>
                  <Text style={st.label}>JUDUL MODUL</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Contoh: Dasar-Dasar Forex"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    selectionColor={colors.gold}
                    style={st.input}
                  />
                </View>

                {/* Subjudul */}
                <View style={st.fieldCol}>
                  <Text style={st.label}>SUBJUDUL / RINGKASAN</Text>
                  <TextInput
                    value={subtitle}
                    onChangeText={setSubtitle}
                    placeholder="Contoh: Mengenal pasar, pair, pip, dan lot"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    selectionColor={colors.gold}
                    style={st.input}
                  />
                </View>

                {/* Level */}
                <View style={st.fieldCol}>
                  <Text style={st.label}>TINGKAT KESULITAN</Text>
                  <View style={st.chipsRow}>
                    {(['Pemula', 'Menengah', 'Lanjutan'] as Module['level'][]).map((lvl) => {
                      const active = level === lvl;
                      return (
                        <Pressable
                          key={lvl}
                          onPress={() => {
                            tap('select');
                            setLevel(lvl);
                          }}
                          style={[st.levelChip, active && st.levelChipActive]}
                        >
                          <Text style={[st.levelChipText, active && st.levelChipTextActive]}>{lvl}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Ikon */}
                <View style={st.fieldCol}>
                  <Text style={st.label}>PILIHAN IKON</Text>
                  <View style={st.chipsRow}>
                    {iconOptions.map((ico) => {
                      const active = icon === ico;
                      return (
                        <Pressable
                          key={ico}
                          onPress={() => {
                            tap('select');
                            setIcon(ico);
                          }}
                          style={[st.iconBtn, active && st.iconBtnActive]}
                        >
                          <Ionicons name={ico} size={20} color={active ? colors.ink : colors.textDim} />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Tombol Simpan */}
                <View style={{ marginTop: 8 }}>
                  <PressScale onPress={loading || !title.trim() ? undefined : handleSave}>
                    <LinearGradient
                      colors={title.trim() ? goldGradient : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[st.saveBtn, (!title.trim() || loading) && { opacity: 0.5 }]}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color={colors.ink} />
                      ) : (
                        <Text style={[st.saveBtnText, { color: title.trim() ? colors.ink : 'rgba(255,255,255,0.3)' }]}>
                          Simpan Modul
                        </Text>
                      )}
                    </LinearGradient>
                  </PressScale>
                </View>
              </ScrollView>
            </BlurView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <UnsavedChangesModal
        visible={showDiscard}
        onStay={() => setShowDiscard(false)}
        onDiscard={() => {
          setShowDiscard(false);
          onClose();
        }}
      />
    </>
  );
}

/* ─── MODAL EDITOR BAB (LESSON) ─── */
export function LessonEditorModal({
  visible,
  moduleId,
  lessonToEdit,
  onClose,
  onSave,
}: {
  visible: boolean;
  moduleId: string;
  lessonToEdit?: Lesson | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    minutes: number;
    youtubeUrls: string[];
    content: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('5');
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  useEffect(() => {
    if (lessonToEdit) {
      setTitle(lessonToEdit.title);
      setMinutes(String(lessonToEdit.minutes || 5));
      setYoutubeUrls(lessonToEdit.youtubeUrls && lessonToEdit.youtubeUrls.length > 0 ? [...lessonToEdit.youtubeUrls] : []);
      setContent(lessonToEdit.content || '');
    } else {
      setTitle('');
      setMinutes('5');
      setYoutubeUrls([]);
      setContent('');
    }
  }, [lessonToEdit, visible]);

  const isDirty = lessonToEdit
    ? title !== lessonToEdit.title ||
      minutes !== String(lessonToEdit.minutes) ||
      content !== lessonToEdit.content ||
      JSON.stringify(youtubeUrls) !== JSON.stringify(lessonToEdit.youtubeUrls || [])
    : title.trim().length > 0 || content.trim().length > 0 || youtubeUrls.length > 0;

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSave({
        title,
        minutes: parseInt(minutes, 10) || 5,
        youtubeUrls,
        content,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  /* Speed Toolbar Handler */
  const insertTemplate = (snippet: string) => {
    tap('select');
    setContent((prev) => (prev ? prev + '\n\n' + snippet : snippet));
  };

  /* Dynamic YouTube URL Handlers */
  const addYouTubeField = () => {
    tap('select');
    setYoutubeUrls((prev) => [...prev, '']);
  };

  const updateYouTubeUrl = (index: number, val: string) => {
    setYoutubeUrls((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const removeYouTubeUrl = (index: number) => {
    tap('light');
    setYoutubeUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleRequestClose}>
        <View style={st.editorOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
            <BlurView intensity={45} tint="dark" style={st.editorSheet}>
              {/* Header */}
              <View style={st.editorHead}>
                <View>
                  <Text style={st.editorTitle}>{lessonToEdit ? 'Edit Bab Materi' : 'Tambah Bab Baru'}</Text>
                  <Text style={st.editorSub}>Isi penjelasan, video, dan template edukasi</Text>
                </View>
                <Pressable onPress={handleRequestClose} hitSlop={10} style={st.closeIconBtn}>
                  <Ionicons name="close" size={20} color={colors.textDim} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 560 }} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
                {/* Judul Bab */}
                <View style={st.fieldCol}>
                  <Text style={st.label}>JUDUL BAB</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Contoh: Apa Itu Pip & Lot?"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    selectionColor={colors.gold}
                    style={st.input}
                  />
                </View>

                {/* Estimasi Durasi */}
                <View style={st.fieldCol}>
                  <Text style={st.label}>ESTIMASI WAKTU BACA / TONTON (MENIT)</Text>
                  <TextInput
                    value={minutes}
                    onChangeText={setMinutes}
                    placeholder="5"
                    keyboardType="number-pad"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    selectionColor={colors.gold}
                    style={st.input}
                  />
                </View>

                {/* Bagian Video YouTube (Dinamis / Opsional) */}
                <View style={st.fieldCol}>
                  <View style={st.labelRow}>
                    <Text style={st.label}>VIDEO YOUTUBE (OPSIONAL)</Text>
                    <Pressable onPress={addYouTubeField} style={st.addVideoLinkBtn} hitSlop={8}>
                      <Ionicons name="add" size={14} color={colors.gold} />
                      <Text style={st.addVideoLinkText}>Tambah Video</Text>
                    </Pressable>
                  </View>

                  {youtubeUrls.length === 0 ? (
                    <Text style={st.hintEmpty}>{'Belum ada video. Tekan "+ Tambah Video" jika bab ini memiliki video.'}</Text>
                  ) : (
                    youtubeUrls.map((url, idx) => (
                      <View key={idx} style={st.urlInputRow}>
                        <Ionicons name="logo-youtube" size={16} color={colors.red} style={{ marginLeft: 8 }} />
                        <TextInput
                          value={url}
                          onChangeText={(v) => updateYouTubeUrl(idx, v)}
                          placeholder="Paste link YouTube (watch / youtu.be / shorts)"
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          selectionColor={colors.gold}
                          autoCapitalize="none"
                          style={[st.input, { flex: 1, borderWidth: 0, paddingLeft: 6 }]}
                        />
                        <Pressable onPress={() => removeYouTubeUrl(idx)} hitSlop={8} style={{ padding: 8 }}>
                          <Ionicons name="trash-outline" size={16} color={colors.red} />
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>

                {/* Speed Toolbar (Tombol Template Format Cepat) */}
                <View style={st.fieldCol}>
                  <Text style={st.label}>TEMPLATE FORMAT CEPAT</Text>
                  <View style={st.toolbarRow}>
                    <Pressable onPress={() => insertTemplate('## Judul Bagian Baru')} style={st.toolBtn}>
                      <Text style={st.toolBtnText}>+ Subjudul</Text>
                    </Pressable>
                    <Pressable onPress={() => insertTemplate('> Catatan penting / tips emas trader...')} style={st.toolBtn}>
                      <Text style={st.toolBtnText}>+ Tips Box</Text>
                    </Pressable>
                    <Pressable onPress={() => insertTemplate('- Poin pertama\n- Poin kedua')} style={st.toolBtn}>
                      <Text style={st.toolBtnText}>+ Poin</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Isi Konten Materi */}
                <View style={st.fieldCol}>
                  <Text style={st.label}>ISI TEKS MATERI</Text>
                  <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Tulis materi pembelajaran di sini..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    selectionColor={colors.gold}
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                    style={[st.input, st.textArea]}
                  />
                </View>

                {/* Tombol Simpan */}
                <View style={{ marginTop: 8 }}>
                  <PressScale onPress={loading || !title.trim() ? undefined : handleSave}>
                    <LinearGradient
                      colors={title.trim() ? goldGradient : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[st.saveBtn, (!title.trim() || loading) && { opacity: 0.5 }]}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color={colors.ink} />
                      ) : (
                        <Text style={[st.saveBtnText, { color: title.trim() ? colors.ink : 'rgba(255,255,255,0.3)' }]}>
                          Simpan Materi Bab
                        </Text>
                      )}
                    </LinearGradient>
                  </PressScale>
                </View>
              </ScrollView>
            </BlurView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <UnsavedChangesModal
        visible={showDiscard}
        onStay={() => setShowDiscard(false)}
        onDiscard={() => {
          setShowDiscard(false);
          onClose();
        }}
      />
    </>
  );
}

const st = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDimmer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6,8,12,0.72)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(12,16,24,0.92)',
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
  },
  deleteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(235,87,87,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalDesc: {
    color: colors.textDim,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: colors.textDim,
    fontFamily: fonts.semi,
    fontSize: 13,
  },
  deleteBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 13,
  },

  /* Editor Sheet */
  editorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  editorSheet: {
    backgroundColor: 'rgba(10,14,20,0.96)',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  editorHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 12,
  },
  editorTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  editorSub: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fieldCol: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: fonts.semi,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  input: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 13.5,
  },
  textArea: {
    height: 140,
    paddingTop: 12,
    lineHeight: 20,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  levelChipActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(237,193,58,0.12)',
  },
  levelChipText: {
    color: colors.textDim,
    fontFamily: fonts.medium,
    fontSize: 12.5,
  },
  levelChipTextActive: {
    color: colors.gold,
    fontFamily: fonts.bold,
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },

  addVideoLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addVideoLinkText: {
    color: colors.gold,
    fontFamily: fonts.semi,
    fontSize: 11.5,
  },
  hintEmpty: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: fonts.body,
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },

  toolbarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(237,193,58,0.25)',
    backgroundColor: 'rgba(237,193,58,0.08)',
  },
  toolBtnText: {
    color: colors.gold,
    fontFamily: fonts.semi,
    fontSize: 11.5,
  },

  saveBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
