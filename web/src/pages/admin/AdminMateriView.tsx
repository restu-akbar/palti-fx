import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, Video, Clock, Eye, X, Check, AlertTriangle, Play, Film, BookOpen, Smartphone, FileText, Copy, CheckCheck, ArrowRight, Image as ImageIcon, Camera, Search, GripVertical } from 'lucide-react';
import type { EduLesson, EduModule } from '../../types/admin';
import { AdminMateriService, extractYouTubeId } from '../../lib/adminMateri';
import { IoniconsPicker, IonIconPreview } from '../../components/admin/IoniconsPicker';

import { isVideoFileUrl } from '../../lib/materiContent';
import { searchEduLessons } from '../../lib/materiSearch';
import { MobileRichText } from '../../components/admin/MobileRichText';
import { LessonEditorPage } from '../../components/admin/LessonEditorPage';
import { moveItem, useDragReorder } from '../../lib/dragReorder';

export const AdminMateriView: React.FC = () => {
  const [modules, setModules] = useState<EduModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModId, setSelectedModId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showModModal, setShowModModal] = useState(false);
  const [editingModule, setEditingModule] = useState<EduModule | null>(null);
  const [modTitle, setModTitle] = useState('');
  const [modSubtitle, setModSubtitle] = useState('');
  const [modLevel, setModLevel] = useState<'Pemula' | 'Menengah' | 'Lanjutan'>('Pemula');
  const [modIcon, setModIcon] = useState('school-outline');

  const [showLesModal, setShowLesModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<EduLesson | null>(null);

  // Lightbox Modal State
  const [lightboxImg, setLightboxImg] = useState<{ url: string; caption?: string } | null>(null);

  // Preview Modal
  const [previewLesson, setPreviewLesson] = useState<EduLesson | null>(null);
  const [previewVideoIdx, setPreviewVideoIdx] = useState(0);
  const [previewMode, setPreviewMode] = useState<'mobile_vip' | 'pure_text'>('mobile_vip');
  const [copiedText, setCopiedText] = useState(false);

  const previewParentModule = useMemo(() => {
    if (!previewLesson) return null;
    return modules.find((m) => m.lessons?.some((l) => l.id === previewLesson.id)) || null;
  }, [previewLesson, modules]);

  const previewChapterIndex = useMemo(() => {
    if (!previewLesson || !previewParentModule?.lessons) return 1;
    const idx = previewParentModule.lessons.findIndex((l) => l.id === previewLesson.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [previewLesson, previewParentModule]);

  const previewTotalChapters = useMemo(() => {
    return previewParentModule?.lessons?.length || 1;
  }, [previewParentModule]);

  const textWordCount = useMemo(() => {
    if (!previewLesson?.content) return 0;
    return previewLesson.content.trim().split(/\s+/).filter(Boolean).length;
  }, [previewLesson]);

  const textCharCount = useMemo(() => {
    return previewLesson?.content?.length || 0;
  }, [previewLesson]);

  const handleCopyPureText = () => {
    if (!previewLesson?.content) return;
    navigator.clipboard.writeText(previewLesson.content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Delete Confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'module' | 'lesson'; id: string; name: string } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await AdminMateriService.getModules();
      setModules(data);
      if (data.length > 0 && (!selectedModId || !data.some(m => m.id === selectedModId))) {
        setSelectedModId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const notify = (text: string, error?: boolean) => {
    setFeedbackMsg({ text, error });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const selectedModule = modules.find((m) => m.id === selectedModId) || modules[0] || null;
  const selectedModIdx = selectedModule ? modules.findIndex((m) => m.id === selectedModule.id) : 0;

  // Overview metrics
  const totalLessons = useMemo(() => {
    return modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  }, [modules]);

  const totalVideos = useMemo(() => {
    return modules.reduce((acc, m) => {
      return acc + (m.lessons?.reduce((lAcc, l) => lAcc + (l.youtube_urls?.length || 0), 0) || 0);
    }, 0);
  }, [modules]);

  // Hasil pencarian bab & subbab
  const searchResults = useMemo(() => {
    return searchEduLessons(modules, searchQuery);
  }, [modules, searchQuery]);

  /* ─── Handlers Modul ─── */
  const handleOpenAddModule = () => {
    setEditingModule(null);
    setModTitle('');
    setModSubtitle('');
    setModLevel('Pemula');
    setModIcon('school-outline');
    setShowModModal(true);
  };

  const handleOpenEditModule = (mod: EduModule) => {
    setEditingModule(mod);
    setModTitle(mod.title);
    setModSubtitle(mod.subtitle || '');
    setModLevel(mod.level);
    setModIcon(mod.icon || 'school-outline');
    setShowModModal(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitle.trim()) {
      notify('Judul modul wajib diisi.', true);
      return;
    }
    setActionLoading(true);

    if (editingModule) {
      const res = await AdminMateriService.updateModule(editingModule.id, {
        title: modTitle,
        subtitle: modSubtitle,
        level: modLevel,
        icon: modIcon,
      });
      if (res.success) {
        notify(`Modul "${modTitle.trim()}" berhasil diperbarui.`);
        setShowModModal(false);
        setEditingModule(null);
        fetchModules();
      } else {
        notify(res.error || 'Gagal memperbarui modul.', true);
      }
    } else {
      const res = await AdminMateriService.createModule({
        title: modTitle,
        subtitle: modSubtitle,
        level: modLevel,
        icon: modIcon,
      });
      if (res.success) {
        notify('Modul baru berhasil ditambahkan.');
        setShowModModal(false);
        fetchModules();
      } else {
        notify(res.error || 'Gagal tambah modul.', true);
      }
    }
    setActionLoading(false);
  };

  // Garis penanda posisi jatuh saat menyeret baris
  const dropShadow = (edge: 'top' | 'bottom' | null) =>
    edge === 'top' ? 'inset 0 2px 0 var(--gold-accent)' : edge === 'bottom' ? 'inset 0 -2px 0 var(--gold-accent)' : undefined;

  // Mengubah urutan modul (seret-lepas atau tombol panah); kembali ke urutan server bila gagal disimpan
  const handleReorderModules = async (from: number, to: number) => {
    const reordered = moveItem(modules, from, to);
    if (reordered === modules) return;
    setModules(reordered);

    const res = await AdminMateriService.reorderModules(reordered.map((m) => m.id));
    if (!res.success) {
      notify(res.error || 'Gagal menyimpan urutan modul.', true);
      fetchModules();
    }
  };

  /* ─── Handlers Bab ─── */
  // Editor bab berupa halaman penuh (LessonEditorPage); di sini hanya mengatur kapan ia dibuka/ditutup
  const handleOpenAddLesson = () => {
    if (!selectedModule) return;
    setEditingLesson(null);
    setShowLesModal(true);
  };

  const handleOpenEditLesson = (les: EduLesson) => {
    setEditingLesson(les);
    setShowLesModal(true);
  };

  const handleCloseLessonEditor = () => {
    setShowLesModal(false);
    setEditingLesson(null);
  };

  const handleLessonSaved = () => {
    handleCloseLessonEditor();
    fetchModules();
  };

  // Mengubah urutan bab di modul terpilih (seret-lepas atau tombol panah)
  const handleReorderLessons = async (from: number, to: number) => {
    if (!selectedModule) return;
    const lessons = selectedModule.lessons || [];
    const reordered = moveItem(lessons, from, to);
    if (reordered === lessons) return;

    setModules(modules.map((m) => (m.id === selectedModule.id ? { ...m, lessons: reordered } : m)));

    const res = await AdminMateriService.reorderLessons(reordered.map((l) => l.id));
    if (!res.success) {
      notify(res.error || 'Gagal menyimpan urutan bab.', true);
      fetchModules();
    }
  };

  const moduleDnd = useDragReorder(handleReorderModules);
  const lessonDnd = useDragReorder(handleReorderLessons);

  /* ─── Delete Execution ─── */
  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);

    if (deleteConfirm.type === 'module') {
      const res = await AdminMateriService.deleteModule(deleteConfirm.id);
      if (res.success) {
        notify(`Modul "${deleteConfirm.name}" berhasil dihapus.`);
        fetchModules();
      } else {
        notify(res.error || 'Gagal menghapus modul.', true);
      }
    } else {
      const res = await AdminMateriService.deleteLesson(deleteConfirm.id);
      if (res.success) {
        notify(`Bab "${deleteConfirm.name}" berhasil dihapus.`);
        fetchModules();
      } else {
        notify(res.error || 'Gagal menghapus bab.', true);
      }
    }
    setActionLoading(false);
    setDeleteConfirm(null);
  };

  // Editor bab tampil sebagai halaman penuh, menggantikan daftar silabus
  if (showLesModal && selectedModule) {
    return (
      <>
        <LessonEditorPage
          key={editingLesson?.id ?? 'new'}
          moduleId={selectedModule.id}
          moduleTitle={selectedModule.title}
          lesson={editingLesson}
          onClose={handleCloseLessonEditor}
          onSaved={handleLessonSaved}
          notify={notify}
        />
        {feedbackMsg && (
          <div
            role="status"
            style={{
              position: 'fixed', left: '50%', bottom: '1.5rem', transform: 'translateX(-50%)', zIndex: 1500, maxWidth: '90vw',
              padding: '0.75rem 1.1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              backgroundColor: feedbackMsg.error ? 'var(--danger-bg)' : 'var(--success-bg)',
              border: `1px solid ${feedbackMsg.error ? 'var(--danger-border)' : 'var(--success-border)'}`,
              color: feedbackMsg.error ? '#FDA4AF' : '#6EE7B7',
            }}
          >
            {feedbackMsg.text}
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* ─── Editorial Header: Unboxed, Natural & Calm ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '2.75rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div>
          {/* Section Marker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--gold-accent)' }}>
              01
            </span>
            <span style={{ width: '22px', height: '1px', background: 'var(--gold-border)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
              Kurikulum &amp; Materi Edukasi
            </span>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 600, color: '#FFF', letterSpacing: '-0.02em' }}>
            Silabus Pembelajaran Forex
          </h1>

          {/* Natural Text Metrics Bar (Tanpa Card) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.55rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span>
              <strong style={{ color: '#FFF', fontWeight: 600 }}>{modules.length}</strong> Modul
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span>
              <strong style={{ color: '#FFF', fontWeight: 600 }}>{totalLessons}</strong> Bab Materi
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span>
              <strong style={{ color: 'var(--gold-accent)', fontWeight: 600 }}>{totalVideos}</strong> Video YouTube
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Bar Input */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={13}
              color="var(--text-dim)"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              type="text"
              className="pfx-input"
              placeholder="Cari bab, subbab, kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '2.2rem',
                fontSize: '0.82rem',
                paddingRight: searchQuery ? '2rem' : '0.85rem',
                height: '36px',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                }}
                title="Bersihkan pencarian"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button onClick={handleOpenAddModule} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <Plus size={15} />
            <span>Tambah Modul</span>
          </button>
        </div>
      </div>

      {/* ─── HASIL PENCARIAN MATERI (BAB & SUBBAB) ─── */}
      {searchQuery.trim().length > 0 && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.35rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(13, 17, 24, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(212, 175, 55, 0.22)',
          boxShadow: '0 18px 45px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-accent)',
              }}>
                <Search size={14} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFF', margin: 0 }}>
                Hasil Pencarian Bab: <span style={{ color: 'var(--gold-accent)' }}>"{searchQuery}"</span>
              </h3>
              <span style={{
                fontSize: '0.72rem',
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                color: 'var(--gold-accent)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 600,
              }}>
                {searchResults.length} Bab Ditemukan
              </span>
            </div>

            <button
              onClick={() => setSearchQuery('')}
              className="btn-cancel"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <X size={13} />
              <span>Tutup Hasil</span>
            </button>
          </div>

          {/* List of Results */}
          {searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '0.88rem', marginBottom: '0.4rem', color: '#FFF' }}>
                Tidak ada bab atau subbab yang cocok dengan kata kunci "{searchQuery}"
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '480px', margin: '0 auto' }}>
                Coba cari dengan kata kunci lain seperti: <em>pair, pip, lot, leverage, candlestick, support, resistance</em>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.85rem' }}>
              {searchResults.map((item) => (
                <div
                  key={item.lessonId}
                  onClick={() => {
                    setSelectedModId(item.moduleId);
                    setPreviewLesson(item.lesson);
                  }}
                  className="pfx-card pfx-card-interactive"
                  style={{
                    padding: '1.1rem 1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {/* Row 1: Di modul & bab apa */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: 'var(--gold-accent)', fontWeight: 600 }}>
                      <span>Modul {item.moduleIndex}: {item.moduleTitle}</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                      <span style={{ color: '#FFF' }}>Bab {item.lessonIndex}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      <Clock size={11} />
                      <span>{item.minutes}m</span>
                      {item.hasVideo && <Video size={11} color="var(--danger)" />}
                    </div>
                  </div>

                  {/* Row 2: Judul Bab */}
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFF', margin: 0, lineHeight: 1.35 }}>
                    {item.lessonTitle}
                  </h4>

                  {/* Row 3: Subbab atau Cuplikan Kata Kunci */}
                  {item.matchedSubbab && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(212, 175, 55, 0.08)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      fontSize: '0.75rem',
                      color: 'var(--gold-accent)',
                      fontWeight: 500,
                      alignSelf: 'flex-start',
                    }}>
                      <BookOpen size={12} color="var(--gold-accent)" />
                      <span>Subbab: <strong>{item.matchedSubbab}</strong></span>
                    </div>
                  )}

                  {item.snippet && (
                    <p style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      margin: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.22)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}>
                      "{item.snippet}"
                    </p>
                  )}

                  {/* Row 4: Aksi Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: 'auto' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      Klik untuk preview naskah
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModId(item.moduleId);
                        setSearchQuery('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--gold-accent)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span>Buka di Silabus</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {feedbackMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.75rem',
          backgroundColor: feedbackMsg.error ? 'var(--danger-bg)' : 'var(--success-bg)',
          border: `1px solid ${feedbackMsg.error ? 'var(--danger-border)' : 'var(--success-border)'}`,
          color: feedbackMsg.error ? '#FDA4AF' : '#6EE7B7',
          fontSize: '0.84rem',
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Memuat kurikulum edukasi...
        </div>
      ) : modules.length === 0 ? (
        <div style={{
          padding: '4.5rem 2rem',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <BookOpen size={36} color="var(--gold-accent)" style={{ opacity: 0.8, marginBottom: '0.75rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
            Belum Ada Modul Edukasi
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
            Kurikulum masih kosong. Mulai rancang materi trading Anda dengan menambahkan modul pembelajaran pertama.
          </p>
          <button onClick={handleOpenAddModule} className="btn-primary">
            <Plus size={15} />
            <span>Tambah Modul Sekarang</span>
          </button>
        </div>
      ) : (
        /* ─── Seamless Two-Column Workspace (Unboxed, Natural Flow) ─── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '290px 1fr',
          gap: '2.5rem',
          alignItems: 'start',
        }}>
          {/* ─── Sisi Kiri: Navigasi Indeks Modul (Unboxed, Nyaru) ─── */}
          <div style={{
            padding: 0,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.65rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-dim)',
              }}>
                Daftar Modul ({modules.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {modules.map((mod, modIdx) => {
                const isSelected = selectedModId === mod.id;
                const lessonCount = mod.lessons?.length || 0;

                return (
                  <div
                    key={mod.id}
                    onClick={() => setSelectedModId(mod.id)}
                    {...moduleDnd.rowProps(modIdx)}
                    title="Seret untuk mengubah urutan modul"
                    style={{
                      opacity: moduleDnd.dragIndex === modIdx ? 0.4 : 1,
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.045)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.65rem',
                      transition: 'all 0.15s ease',
                      border: isSelected ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
                      boxShadow: dropShadow(moduleDnd.dropEdge(modIdx)) ?? (isSelected ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08)' : 'none'),
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <span aria-hidden style={{ display: 'inline-flex', cursor: 'grab', color: 'var(--text-dim)', marginLeft: '-4px' }}>
                          <GripVertical size={12} />
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          color: isSelected ? 'var(--gold-accent)' : 'var(--text-dim)',
                        }}>
                          {String(modIdx + 1).padStart(2, '0')}
                        </span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.7rem' }}>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '1px' }}>
                          <IonIconPreview name={mod.icon || 'school-outline'} size={12} color={isSelected ? 'var(--gold-accent)' : 'var(--text-dim)'} />
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {mod.level}
                        </span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.7rem' }}>•</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {lessonCount} Bab
                        </span>
                      </div>

                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#FFF' : 'var(--text-secondary)',
                        lineHeight: 1.35,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {mod.title}
                      </div>
                    </div>

                    {/* Order & Edit buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditModule(mod)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '3px',
                          display: 'inline-flex',
                          marginRight: '2px',
                        }}
                        title="Edit Modul"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleReorderModules(modIdx, modIdx - 1)}
                        disabled={modIdx === 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: modIdx === 0 ? 'rgba(255, 255, 255, 0.06)' : 'var(--text-dim)',
                          cursor: modIdx === 0 ? 'default' : 'pointer',
                          padding: '3px',
                          display: 'inline-flex',
                        }}
                        title="Geser Naik"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => handleReorderModules(modIdx, modIdx + 1)}
                        disabled={modIdx === modules.length - 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: modIdx === modules.length - 1 ? 'rgba(255, 255, 255, 0.06)' : 'var(--text-dim)',
                          cursor: modIdx === modules.length - 1 ? 'default' : 'pointer',
                          padding: '3px',
                          display: 'inline-flex',
                        }}
                        title="Geser Turun"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Sisi Kanan: Detail Modul & Garis Silabus (Natural Syllabus Canvas) ─── */}
          {selectedModule && (
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header Modul Terpilih (Unboxed, Nyaru) */}
              <div style={{
                marginBottom: '1.75rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--gold-accent)',
                      }}>
                        MODUL {String(selectedModIdx + 1).padStart(2, '0')} / {String(modules.length).padStart(2, '0')}
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        letterSpacing: '0.04em',
                      }}>
                        Tingkat {selectedModule.level}
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                      <span style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-dim)',
                      }}>
                        Tersimpan di Cloud
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(227, 182, 79, 0.1)',
                          border: '1px solid rgba(227, 182, 79, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--gold-accent)',
                          flexShrink: 0,
                        }}
                        title={`Ikon: ${selectedModule.icon || 'school-outline'}`}
                      >
                        <IonIconPreview name={selectedModule.icon || 'school-outline'} size={20} color="var(--gold-accent)" />
                      </div>
                      <h2 style={{
                        fontSize: '1.45rem',
                        fontWeight: 600,
                        color: '#FFF',
                        letterSpacing: '-0.015em',
                        lineHeight: 1.3,
                        margin: 0,
                      }}>
                        {selectedModule.title}
                      </h2>
                    </div>

                    {selectedModule.subtitle && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '700px' }}>
                        {selectedModule.subtitle}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button
                      onClick={handleOpenAddLesson}
                      className="btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                    >
                      <Plus size={14} />
                      <span>Tambah Bab</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModule(selectedModule)}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.5rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Edit Modul Ini"
                    >
                      <Pencil size={13} />
                      <span>Edit Modul</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirm({ type: 'module', id: selectedModule.id, name: selectedModule.title })}
                      className="btn-danger-ghost"
                      style={{ fontSize: '0.78rem', padding: '0.5rem 0.75rem' }}
                      title="Hapus Modul Ini"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-Header Silabus */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-dim)',
                }}>
                  Bab Pembelajaran ({selectedModule.lessons?.length || 0})
                </div>
              </div>

              {(!selectedModule.lessons || selectedModule.lessons.length === 0) ? (
                <div style={{
                  padding: '4rem 1.5rem',
                  textAlign: 'center',
                }}>
                  <BookOpen size={30} color="var(--gold-accent)" style={{ opacity: 0.7, marginBottom: '0.75rem' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
                    Belum Ada Bab Materi
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                    Modul ini belum memiliki bab pembelajaran. Mulai masukkan materi video dan naskah panduan silabus trading.
                  </p>
                  <button onClick={handleOpenAddLesson} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}>
                    <Plus size={14} />
                    <span>Tambah Bab Pertama</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {selectedModule.lessons.map((les, lesIdx) => {
                    const videoCount = les.youtube_urls?.length || 0;

                    return (
                      <div
                        key={les.id}
                        {...lessonDnd.rowProps(lesIdx)}
                        style={{
                          opacity: lessonDnd.dragIndex === lesIdx ? 0.4 : 1,
                          boxShadow: dropShadow(lessonDnd.dropEdge(lesIdx)),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1.15rem 1.25rem',
                          borderBottom: lesIdx === selectedModule.lessons!.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {/* Sisi Kiri: Nomor + Judul + Metadata */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                          <span title="Seret untuk mengubah urutan" aria-hidden style={{ cursor: 'grab', color: 'var(--text-dim)', display: 'inline-flex', paddingTop: '3px', marginRight: '-0.6rem' }}>
                            <GripVertical size={16} />
                          </span>
                          <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: 'var(--gold-accent)',
                            opacity: 0.85,
                            width: '28px',
                            paddingTop: '2px',
                            flexShrink: 0,
                          }}>
                            {String(lesIdx + 1).padStart(2, '0')}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.95rem',
                              fontWeight: 500,
                              color: '#FFF',
                              lineHeight: 1.4,
                              marginBottom: '0.35rem',
                            }}>
                              {les.title}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Clock size={12} color="var(--text-dim)" />
                                <span>{les.minutes} menit baca</span>
                              </span>

                              <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>

                              {videoCount > 0 ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--info)' }}>
                                  <Video size={12} />
                                  <span>{videoCount} Video YouTube</span>
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dim)' }}>
                                  <BookOpen size={12} />
                                  <span>Teks Silabus</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sisi Kanan: Aksi Cepat */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {/* Order arrow buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginRight: '0.35rem' }}>
                            <button
                              onClick={() => handleReorderLessons(lesIdx, lesIdx - 1)}
                              disabled={lesIdx === 0}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: lesIdx === 0 ? 'rgba(255, 255, 255, 0.06)' : 'var(--text-dim)',
                                cursor: lesIdx === 0 ? 'default' : 'pointer',
                                padding: '3px',
                                display: 'inline-flex',
                              }}
                              title="Geser Naik"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={() => handleReorderLessons(lesIdx, lesIdx + 1)}
                              disabled={lesIdx === selectedModule.lessons!.length - 1}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: lesIdx === selectedModule.lessons!.length - 1 ? 'rgba(255, 255, 255, 0.06)' : 'var(--text-dim)',
                                cursor: lesIdx === selectedModule.lessons!.length - 1 ? 'default' : 'pointer',
                                padding: '3px',
                                display: 'inline-flex',
                              }}
                              title="Geser Turun"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>

                          {/* Preview Button */}
                          <button
                            onClick={() => {
                              setPreviewLesson(les);
                              setPreviewVideoIdx(0);
                            }}
                            className="btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Buka Pratinjau Bab"
                          >
                            <Eye size={12} />
                            <span>Pratinjau</span>
                          </button>

                          {/* Edit Button (Icon Pensil diantara Pratinjau dan Hapus) */}
                          <button
                            onClick={() => handleOpenEditLesson(les)}
                            className="btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit Bab"
                          >
                            <Pencil size={12} />
                          </button>

                          {/* Delete Button (Konsisten seperti Pratinjau dengan teks 'Hapus') */}
                          <button
                            onClick={() => setDeleteConfirm({ type: 'lesson', id: les.id, name: les.title })}
                            className="btn-danger-ghost"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Hapus Bab"
                          >
                            <Trash2 size={12} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: Tambah / Edit Modul Edukasi (Tata Letak Rapih) ─── */}
      {showModModal && (
        <div className="pfx-modal-backdrop" onClick={() => setShowModModal(false)}>
          <div
            className="pfx-modal-panel"
            style={{ maxWidth: '640px', width: '100%', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.35rem' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Silabus Kurikulum {editingModule ? '• Ubah Modul' : '• Modul Baru'}
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', margin: '0.2rem 0 0' }}>
                  {editingModule ? 'Edit Modul Edukasi' : 'Tambah Modul Baru'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModule}>
              {/* Seksi 1: Informasi Utama Modul */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                marginBottom: '1rem',
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="pfx-label">
                    Judul Modul <span style={{ color: 'var(--gold-accent)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="pfx-input"
                    placeholder="Contoh: Fondasi Pasar Forex & Karakteristik Pair"
                    value={modTitle}
                    onChange={(e) => setModTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="pfx-label">Sub-judul / Deskripsi Ringkas</label>
                  <input
                    type="text"
                    className="pfx-input"
                    placeholder="Contoh: Pengenalan struktur pasar, likuiditas, dan sesi Tokyo/London/NY"
                    value={modSubtitle}
                    onChange={(e) => setModSubtitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Seksi 2: Pengaturan Level & Tampilan Ikon */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
                marginBottom: '1.25rem',
              }}>
                {/* Pilihan Level (3 Pills Cepat) */}
                <div style={{ marginBottom: '1.15rem' }}>
                  <label className="pfx-label">Tingkat Kesulitan (Level)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {(['Pemula', 'Menengah', 'Lanjutan'] as const).map((lvl) => {
                      const isSelected = modLevel === lvl;
                      const color = lvl === 'Pemula' ? '#34D399' : lvl === 'Menengah' ? 'var(--gold-accent)' : '#A78BFA';
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setModLevel(lvl)}
                          style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid',
                            borderColor: isSelected ? color : 'rgba(255, 255, 255, 0.08)',
                            backgroundColor: isSelected ? `${color}1A` : 'rgba(255, 255, 255, 0.03)',
                            color: isSelected ? '#FFF' : 'var(--text-secondary)',
                            fontWeight: isSelected ? 600 : 400,
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color }} />
                          <span>{lvl}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pemilih Ikon Ionicons dengan Live Preview, Dropdown, dan Panduan Pencarian */}
                <IoniconsPicker value={modIcon} onChange={setModIcon} />
              </div>

              {/* Footer Modal */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Tersimpan langsung ke database
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowModModal(false)} className="btn-cancel">
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={actionLoading}>
                    <span>{actionLoading ? 'Menyimpan...' : editingModule ? 'Simpan Perubahan' : 'Simpan Modul'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Pratinjau Bab (Dual Mode: VIP Mobile Simulator & Pure Text) ─── */}
      {previewLesson && (
        <div className="pfx-modal-backdrop" onClick={() => setPreviewLesson(null)}>
          <div
            className="pfx-modal-panel"
            style={{ maxWidth: '860px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header & Dual Mode Switcher */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {previewParentModule?.title ? `${previewParentModule.title} · ` : ''}Pratinjau Bab
                  </span>
                  <span className="pfx-badge pfx-badge-gold" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                    {previewLesson.minutes} Menit
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', margin: 0 }}>
                  {previewLesson.title}
                </h2>
              </div>

              {/* Mode Switcher Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.28)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile_vip')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.38rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: previewMode === 'mobile_vip' ? 600 : 500,
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: previewMode === 'mobile_vip' ? 'var(--gold-accent)' : 'transparent',
                      color: previewMode === 'mobile_vip' ? '#080B10' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Smartphone size={13} />
                    <span>Tampilan VIP Mobile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewMode('pure_text')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.38rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: previewMode === 'pure_text' ? 600 : 500,
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: previewMode === 'pure_text' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                      color: previewMode === 'pure_text' ? '#FFF' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <FileText size={13} />
                    <span>Teks Murni (Pure)</span>
                  </button>
                </div>

                <button
                  onClick={() => setPreviewLesson(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                  }}
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Metrics & Quick Action Bar (Konsisten di kedua mode pratinjau) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>
                  <strong style={{ color: '#FFF' }}>{textWordCount}</strong> Kata
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
                <span>
                  <strong style={{ color: '#FFF' }}>{textCharCount}</strong> Karakter
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
                <span>
                  Estimasi <strong style={{ color: 'var(--gold-accent)' }}>{previewLesson.minutes} Menit</strong> Baca
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyPureText}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
              >
                {copiedText ? (
                  <>
                    <CheckCheck size={13} color="var(--success)" />
                    <span style={{ color: 'var(--success)' }}>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Salin Naskah Teks</span>
                  </>
                )}
              </button>
            </div>

            {/* Reading Surface Card (Ukuran & tampilan card konsisten di kedua mode) */}
            <div style={{
              backgroundColor: 'rgba(12, 16, 26, 0.38)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              padding: '2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.11)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              maxHeight: '520px',
              overflowY: 'auto',
            }}>
              {previewMode === 'mobile_vip' ? (
                /* ─── TAMPILAN VIP MOBILE: REAL LOOKS MATERI TERFORMAT ─── */
                <div>
                  {/* Eyebrow & Chapter Header */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#E3B64F',
                      letterSpacing: '1.6px',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}>
                      {previewParentModule?.title
                        ? `${previewParentModule.title.toUpperCase()} · BAB ${previewChapterIndex}/${previewTotalChapters}`
                        : 'AKADEMI PALTI FX'}
                    </div>

                    <h1 style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#F5F2EA',
                      letterSpacing: '-0.4px',
                      lineHeight: 1.3,
                      margin: '0 0 14px',
                    }}>
                      {previewLesson.title}
                    </h1>

                    {/* Mobile Meta Chips Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#B4AFA4',
                        backgroundColor: 'rgba(180, 175, 164, 0.08)',
                        border: '1px solid rgba(180, 175, 164, 0.22)',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        letterSpacing: '0.2px',
                      }}>
                        <Clock size={11} />
                        <span>{previewLesson.minutes} menit baca</span>
                      </span>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#35C98A',
                        backgroundColor: 'rgba(53, 201, 138, 0.12)',
                        border: '1px solid rgba(53, 201, 138, 0.28)',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        letterSpacing: '0.2px',
                      }}>
                        <Check size={11} />
                        <span>Materi VIP</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                      marginBottom: '20px',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round((previewChapterIndex / previewTotalChapters) * 100)}%`,
                        backgroundColor: '#E3B64F',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  {/* Embedded Video Top Section (HANYA jika video BELUM disisipkan di dalam naskah) */}
                  {(() => {
                    const content = previewLesson.content || '';
                    const unplaced = (previewLesson.youtube_urls || []).filter((url) => {
                      const ytid = extractYouTubeId(url);
                      if (!ytid) return false;
                      return !content.includes(ytid) && !content.includes(url);
                    });

                    if (unplaced.length === 0) return null;

                    const safeIdx = Math.min(previewVideoIdx, unplaced.length - 1);
                    const currentUrl = unplaced[safeIdx];
                    const videoId = extractYouTubeId(currentUrl);

                    return (
                      <div style={{ marginBottom: '22px' }}>
                        {unplaced.length > 1 && (
                          <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '2px' }}>
                            {unplaced.map((_, vIdx) => (
                              <button
                                key={vIdx}
                                type="button"
                                onClick={() => setPreviewVideoIdx(vIdx)}
                                style={{
                                  padding: '0.3rem 0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: safeIdx === vIdx ? 600 : 500,
                                  borderRadius: '8px',
                                  border: safeIdx === vIdx ? '1px solid #E3B64F' : '1px solid rgba(255,255,255,0.08)',
                                  backgroundColor: safeIdx === vIdx ? 'rgba(227, 182, 79, 0.16)' : 'rgba(255,255,255,0.02)',
                                  color: safeIdx === vIdx ? '#E3B64F' : '#B4AFA4',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <Play size={11} />
                                <span>Video #{vIdx + 1}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {videoId && (
                          <div style={{
                            position: 'relative',
                            paddingBottom: '56.25%',
                            height: 0,
                            overflow: 'hidden',
                            borderRadius: '16px',
                            backgroundColor: '#000',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                          }}>
                            <iframe
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                              title={previewLesson.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* RichText Content dengan Media Inline dan Zoom Foto */}
                  <div style={{ minHeight: '60px' }}>
                    <MobileRichText
                      content={previewLesson.content}
                      onImageClick={(url, caption) => setLightboxImg({ url, caption })}
                    />
                  </div>

                  {/* Simulated Mobile Action Buttons (Rapi, terpisah, tidak tabrakan) */}
                  <div style={{
                    marginTop: '2.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    <button
                      type="button"
                      style={{
                        padding: '12px 24px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #F7DC8E 0%, #E3B64F 50%, #B8892A 100%)',
                        boxShadow: '0 4px 14px rgba(227, 182, 79, 0.28)',
                        color: '#16110A',
                        fontWeight: 800,
                        fontSize: '14px',
                        letterSpacing: '0.2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Selesai &amp; lanjut</span>
                      <ArrowRight size={16} color="#16110A" />
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: '11px 20px',
                        borderRadius: '14px',
                        border: '1px solid rgba(227, 182, 79, 0.35)',
                        backgroundColor: 'rgba(227, 182, 79, 0.08)',
                        color: '#E3B64F',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Tandai belum selesai</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ─── FULL TEXT PURE READER MODE DENGAN CONTAINER EMBED ─── */
                <div>
                  <h1 style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: '#FFF',
                    letterSpacing: '-0.015em',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  }}>
                    {previewLesson.title}
                  </h1>

                  <div>
                    {(() => {
                      const raw = previewLesson.content || '';
                      if (!raw.trim()) {
                        return <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Belum ada konten tertulis untuk bab ini.</div>;
                      }
                      const lines = raw.split('\n');
                      const elements: React.ReactNode[] = [];
                      let textBuffer: string[] = [];

                      const flushText = (k: string) => {
                        if (textBuffer.length > 0) {
                          elements.push(
                            <div key={k} style={{ marginBottom: '14px', lineHeight: 1.85, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                              {textBuffer.join('\n')}
                            </div>
                          );
                          textBuffer = [];
                        }
                      };

                      lines.forEach((line, idx) => {
                        const trimmed = line.trim();
                        const imgMdMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
                        const imgTagMatch = trimmed.match(/^\[(?:foto|gambar|media_foto):\s*(.*?)(?:\s*\|\s*id=["'](.*?)["'])?\]$/i);
                        const isDirectBase64 = /^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(trimmed);

                        if (imgMdMatch || imgTagMatch || isDirectBase64) {
                          flushText(`tb-${idx}`);
                          const cap = imgMdMatch ? imgMdMatch[1] : imgTagMatch ? imgTagMatch[1] : 'Foto Materi';
                          elements.push(
                            <div
                              key={`pure-img-${idx}`}
                              style={{
                                margin: '14px 0',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(227, 182, 79, 0.05)',
                                border: '1px solid rgba(227, 182, 79, 0.22)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                              }}
                            >
                              <ImageIcon size={16} color="var(--gold-accent)" />
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#F5F2EA' }}>
                                  Foto: {cap || 'Ilustrasi Materi'}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--gold-accent)', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(227, 182, 79, 0.12)' }}>
                                  Media Tersemat
                                </span>
                              </div>
                            </div>
                          );
                          return;
                        }

                        const fileVideoUrl = (trimmed.match(/^\[(?:VIDEO|video):.*?\|\s*url=["'](.*?)["']/)?.[1] ?? trimmed).trim();
                        if (isVideoFileUrl(fileVideoUrl)) {
                          flushText(`tb-${idx}`);
                          elements.push(
                            <div
                              key={`pure-vf-${idx}`}
                              style={{
                                margin: '14px 0',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(235, 87, 87, 0.05)',
                                border: '1px solid rgba(235, 87, 87, 0.22)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                              }}
                            >
                              <Film size={16} color="#EB5757" />
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#F5F2EA' }}>
                                  {fileVideoUrl.split('?')[0].split('/').pop()}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#EB5757', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(235, 87, 87, 0.12)' }}>
                                  Video Unggahan
                                </span>
                              </div>
                            </div>
                          );
                          return;
                        }

                        const videoEmbedMatch = trimmed.match(/^\[(?:VIDEO|video):\s*(.*?)(?:\s*\|\s*url=["'](.*?)["'])?(?:\s*\|\s*id=["'](.*?)["'])?\]$/i);
                        const isYtTag = /^\[video(?::|\s+)(.*?)\]$/i.test(trimmed);
                        const potentialYtUrl = videoEmbedMatch && videoEmbedMatch[2]
                          ? videoEmbedMatch[2].trim()
                          : videoEmbedMatch && videoEmbedMatch[1] && (videoEmbedMatch[1].startsWith('http') || extractYouTubeId(videoEmbedMatch[1]))
                          ? videoEmbedMatch[1].trim()
                          : isYtTag
                          ? trimmed.replace(/^\[video(?::|\s+)(.*?)\]$/i, '$1').trim()
                          : trimmed;
                        const ytId = extractYouTubeId(potentialYtUrl);
                        if (ytId && (videoEmbedMatch || isYtTag || potentialYtUrl.startsWith('http://') || potentialYtUrl.startsWith('https://'))) {
                          flushText(`tb-${idx}`);
                          elements.push(
                            <div
                              key={`pure-yt-${idx}`}
                              style={{
                                margin: '14px 0',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(235, 87, 87, 0.05)',
                                border: '1px solid rgba(235, 87, 87, 0.22)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                              }}
                            >
                              <Film size={16} color="#EB5757" />
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#F5F2EA' }}>
                                  Video: {ytId}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#EB5757', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(235, 87, 87, 0.12)' }}>
                                  Video YouTube
                                </span>
                              </div>
                            </div>
                          );
                          return;
                        }

                        textBuffer.push(line);
                      });

                      flushText('tb-end');
                      return elements;
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setPreviewLesson(null)} className="btn-secondary">
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Delete Safeguard Confirmation ─── */}
      {deleteConfirm && (
        <div className="pfx-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <AlertTriangle size={20} color="var(--danger)" />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
              Hapus {deleteConfirm.type === 'module' ? 'Modul' : 'Bab'}?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Tindakan ini tidak dapat dibatalkan. "{deleteConfirm.name}" akan dihapus permanen dari Supabase.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn-cancel">
                Batal
              </button>
              <button onClick={executeDelete} className="btn-danger-ghost" disabled={actionLoading}>
                <Trash2 size={13} />
                <span>{actionLoading ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Lightbox Zoom Foto Resolusi Penuh ─── */}
      {lightboxImg && (
        <div
          className="pfx-modal-backdrop"
          style={{ zIndex: 9999, padding: '1.5rem', backgroundColor: 'rgba(0, 0, 0, 0.88)' }}
          onClick={() => setLightboxImg(null)}
        >
          <div
            style={{
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImg(null)}
              style={{
                position: 'absolute',
                top: '-42px',
                right: 0,
                background: 'none',
                border: 'none',
                color: '#FFF',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
              }}
              title="Tutup"
            >
              <span>Tutup</span>
              <X size={18} />
            </button>

            <img
              src={lightboxImg.url}
              alt={lightboxImg.caption || 'Preview'}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            />

            {lightboxImg.caption && (
              <div style={{
                marginTop: '12px',
                color: '#F5F2EA',
                fontSize: '0.88rem',
                textAlign: 'center',
                backgroundColor: 'rgba(12, 16, 26, 0.85)',
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}>
                <Camera size={14} color="#E3B64F" />
                <span>{lightboxImg.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
