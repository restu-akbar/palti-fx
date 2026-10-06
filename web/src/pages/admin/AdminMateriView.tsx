import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Video, 
  Clock, 
  Eye, 
  X, 
  Check, 
  AlertTriangle, 
  Play, 
  Film, 
  BookOpen 
} from 'lucide-react';
import type { EduLesson, EduModule } from '../../types/admin';
import { AdminMateriService, extractYouTubeId } from '../../lib/adminMateri';

export const AdminMateriView: React.FC = () => {
  const [modules, setModules] = useState<EduModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModId, setSelectedModId] = useState<string | null>(null);

  // Modals state
  const [showModModal, setShowModModal] = useState(false);
  const [modTitle, setModTitle] = useState('');
  const [modSubtitle, setModSubtitle] = useState('');
  const [modLevel, setModLevel] = useState<'Pemula' | 'Menengah' | 'Lanjutan'>('Pemula');
  const [modIcon, setModIcon] = useState('school-outline');

  const [showLesModal, setShowLesModal] = useState(false);
  const [lesTitle, setLesTitle] = useState('');
  const [lesMinutes, setLesMinutes] = useState(5);
  const [lesUrls, setLesUrls] = useState<string[]>([]);
  const [inputUrl, setInputUrl] = useState('');
  const [lesContent, setLesContent] = useState('');

  // Preview Modal
  const [previewLesson, setPreviewLesson] = useState<EduLesson | null>(null);
  const [previewVideoIdx, setPreviewVideoIdx] = useState(0);

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

  /* ─── Handlers Modul ─── */
  const handleOpenAddModule = () => {
    setModTitle('');
    setModSubtitle('');
    setModLevel('Pemula');
    setModIcon('school-outline');
    setShowModModal(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitle.trim()) {
      notify('Judul modul wajib diisi.', true);
      return;
    }
    setActionLoading(true);
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
    setActionLoading(false);
  };

  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= modules.length) return;

    const reordered = [...modules];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setModules(reordered);

    const orderedIds = reordered.map((m) => m.id);
    await AdminMateriService.reorderModules(orderedIds);
  };

  /* ─── Handlers Bab ─── */
  const handleOpenAddLesson = () => {
    if (!selectedModule) return;
    setLesTitle('');
    setLesMinutes(5);
    setLesUrls([]);
    setInputUrl('');
    setLesContent('');
    setShowLesModal(true);
  };

  const handleAddVideoUrl = () => {
    if (!inputUrl.trim()) return;
    const ytid = extractYouTubeId(inputUrl);
    if (!ytid) {
      notify('Tautan YouTube tidak valid. Pastikan format link benar (contoh: https://youtu.be/... atau watch?v=...)', true);
      return;
    }
    setLesUrls([...lesUrls, inputUrl.trim()]);
    setInputUrl('');
  };

  const handleRemoveVideoUrl = (idx: number) => {
    setLesUrls(lesUrls.filter((_, i) => i !== idx));
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule || !lesTitle.trim()) {
      notify('Judul bab wajib diisi.', true);
      return;
    }
    setActionLoading(true);

    const res = await AdminMateriService.createLesson(selectedModule.id, {
      title: lesTitle,
      minutes: lesMinutes,
      youtubeUrls: lesUrls,
      content: lesContent,
    });
    if (res.success) {
      notify('Bab materi baru berhasil ditambahkan.');
      setShowLesModal(false);
      fetchModules();
    } else {
      notify(res.error || 'Gagal membuat bab.', true);
    }
    setActionLoading(false);
  };

  const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
    if (!selectedModule) return;
    const lessons = selectedModule.lessons || [];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= lessons.length) return;

    const reordered = [...lessons];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const updatedModules = modules.map((m) => (m.id === selectedModule.id ? { ...m, lessons: reordered } : m));
    setModules(updatedModules);

    const orderedIds = reordered.map((l) => l.id);
    await AdminMateriService.reorderLessons(orderedIds);
  };

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

        <div>
          <button onClick={handleOpenAddModule} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <Plus size={15} />
            <span>Tambah Modul</span>
          </button>
        </div>
      </div>

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
          {/* ─── Sisi Kiri: Navigasi Indeks Modul (Frosted Glass Card) ─── */}
          <div className="pfx-card" style={{
            padding: '1.25rem',
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
                    style={{
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
                      boxShadow: isSelected ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08)' : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          color: isSelected ? 'var(--gold-accent)' : 'var(--text-dim)',
                        }}>
                          {String(modIdx + 1).padStart(2, '0')}
                        </span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.7rem' }}>•</span>
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

                    {/* Order buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveModule(modIdx, 'up')}
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
                        onClick={() => handleMoveModule(modIdx, 'down')}
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
              {/* Header Modul Terpilih */}
              <div style={{
                marginBottom: '2.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
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

                    <h2 style={{
                      fontSize: '1.45rem',
                      fontWeight: 600,
                      color: '#FFF',
                      letterSpacing: '-0.015em',
                      lineHeight: 1.3,
                      marginBottom: '0.5rem',
                    }}>
                      {selectedModule.title}
                    </h2>

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

              {/* Garis Silabus (Course Outline) — Frosted Glass Card Container */}
              {(!selectedModule.lessons || selectedModule.lessons.length === 0) ? (
                <div className="pfx-card" style={{
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
                <div className="pfx-card" style={{ overflow: 'hidden' }}>
                  {selectedModule.lessons.map((les, lesIdx) => {
                    const videoCount = les.youtube_urls?.length || 0;

                    return (
                      <div
                        key={les.id}
                        style={{
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
                              onClick={() => handleMoveLesson(lesIdx, 'up')}
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
                              onClick={() => handleMoveLesson(lesIdx, 'down')}
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
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                            title="Buka Pratinjau Bab"
                          >
                            <Eye size={12} />
                            <span>Pratinjau</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteConfirm({ type: 'lesson', id: les.id, name: les.title })}
                            className="btn-danger-ghost"
                            style={{ padding: '0.35rem 0.55rem' }}
                            title="Hapus Bab"
                          >
                            <Trash2 size={12} />
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

      {/* ─── MODAL: Tambah Modul Baru (Bersih & Elegan) ─── */}
      {showModModal && (
        <div className="pfx-modal-backdrop" onClick={() => setShowModModal(false)}>
          <div className="pfx-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Silabus Kurikulum
                </span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFF' }}>
                  Tambah Modul Baru
                </h2>
              </div>
              <button onClick={() => setShowModModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModule}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="pfx-label">Judul Modul</label>
                <input
                  type="text"
                  className="pfx-input"
                  placeholder="Contoh: Fondasi Pasar Forex & Karakteristik Pair"
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="pfx-label">Sub-judul / Deskripsi Ringkas</label>
                <input
                  type="text"
                  className="pfx-input"
                  placeholder="Contoh: Pengenalan struktur pasar, likuiditas, dan sesi Tokyo/London/NY"
                  value={modSubtitle}
                  onChange={(e) => setModSubtitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
                <div>
                  <label className="pfx-label">Tingkat Kesulitan (Level)</label>
                  <select
                    className="pfx-select"
                    value={modLevel}
                    onChange={(e) => setModLevel(e.target.value as any)}
                  >
                    <option value="Pemula">Pemula</option>
                    <option value="Menengah">Menengah</option>
                    <option value="Lanjutan">Lanjutan</option>
                  </select>
                </div>

                <div>
                  <label className="pfx-label">Ikon Materi (Ionicons)</label>
                  <input
                    type="text"
                    className="pfx-input"
                    value={modIcon}
                    onChange={(e) => setModIcon(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowModModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  <Check size={14} />
                  <span>{actionLoading ? 'Menyimpan...' : 'Simpan Modul'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Tambah Bab Materi (Bersih & Elegan) ─── */}
      {showLesModal && (
        <div className="pfx-modal-backdrop" onClick={() => setShowLesModal(false)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Bab Pembelajaran • {selectedModule?.title}
                </span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFF' }}>
                  Tambah Bab Baru
                </h2>
              </div>
              <button onClick={() => setShowLesModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="pfx-label">Judul Bab</label>
                  <input
                    type="text"
                    className="pfx-input"
                    placeholder="Contoh: Sesi London Breakout & Validasi Entry"
                    value={lesTitle}
                    onChange={(e) => setLesTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="pfx-label">Estimasi Waktu (Menit)</label>
                  <input
                    type="number"
                    min="1"
                    className="pfx-input"
                    value={lesMinutes}
                    onChange={(e) => setLesMinutes(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* YouTube URLs Section */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="pfx-label" style={{ marginBottom: 0 }}>Sematkan Video YouTube</label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lesUrls.length} Video Tersemat</span>
                </div>

                <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.65rem' }}>
                  <input
                    type="url"
                    className="pfx-input"
                    placeholder="Tempel URL YouTube (https://youtu.be/... atau watch?v=...)"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoUrl}
                    className="btn-secondary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Plus size={14} />
                    <span>Tambah Video</span>
                  </button>
                </div>

                {lesUrls.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {lesUrls.map((url, idx) => {
                      const ytid = extractYouTubeId(url);
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                            <Film size={13} color="var(--info)" style={{ flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              Video #{idx + 1}: {url} (ID: {ytid})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVideoUrl(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                            title="Hapus Video Ini"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lesson Text Content */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="pfx-label">Naskah Materi &amp; Panduan Lengkap</label>
                <textarea
                  className="pfx-textarea"
                  style={{ minHeight: '160px', fontSize: '0.86rem', lineHeight: 1.6 }}
                  placeholder="Ketik silabus penjelasan materi trading di sini..."
                  value={lesContent}
                  onChange={(e) => setLesContent(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowLesModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  <Check size={14} />
                  <span>{actionLoading ? 'Menyimpan...' : 'Simpan Bab'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Pratinjau Bab (Sinematik & Editorial) ─── */}
      {previewLesson && (
        <div className="pfx-modal-backdrop" onClick={() => setPreviewLesson(null)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Pratinjau Siswa Mobile
                </span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#FFF' }}>{previewLesson.title}</h2>
              </div>
              <button onClick={() => setPreviewLesson(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Video Player Section */}
            {previewLesson.youtube_urls && previewLesson.youtube_urls.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                {previewLesson.youtube_urls.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.65rem', overflowX: 'auto' }}>
                    {previewLesson.youtube_urls.map((_, vIdx) => (
                      <button
                        key={vIdx}
                        onClick={() => setPreviewVideoIdx(vIdx)}
                        className={previewVideoIdx === vIdx ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <Play size={10} />
                        <span>Video #{vIdx + 1}</span>
                      </button>
                    ))}
                  </div>
                )}

                {(() => {
                  const currentUrl = previewLesson.youtube_urls[previewVideoIdx];
                  const videoId = extractYouTubeId(currentUrl);

                  if (!videoId) return null;

                  return (
                    <div style={{
                      position: 'relative',
                      paddingBottom: '56.25%',
                      height: 0,
                      overflow: 'hidden',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#000',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
                    }}>
                      <iframe
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                        title={previewLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Reading Content */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.035)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              lineHeight: 1.7,
              fontSize: '0.88rem',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}>
              {previewLesson.content || 'Belum ada konten tertulis untuk bab ini.'}
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
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">
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
    </div>
  );
};
