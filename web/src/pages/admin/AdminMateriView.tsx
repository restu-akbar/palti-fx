import { useEffect, useState } from 'react';
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
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem',
        paddingBottom: '1.15rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 600 }}>
            Kurikulum &amp; Materi Edukasi
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Susun modul pembelajaran, sematkan multi-video YouTube, dan kelola teks silabus trading.
          </p>
        </div>

        <button onClick={handleOpenAddModule} className="btn-primary">
          <Plus size={15} />
          <span>Tambah Modul</span>
        </button>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          backgroundColor: feedbackMsg.error ? 'var(--danger-bg)' : 'var(--success-bg)',
          border: `1px solid ${feedbackMsg.error ? 'var(--danger-border)' : 'var(--success-border)'}`,
          color: feedbackMsg.error ? '#FDA4AF' : '#6EE7B7',
          fontSize: '0.84rem',
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Memuat kurikulum edukasi...
        </div>
      ) : modules.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
        }}>
          <BookOpen size={36} color="var(--gold-accent)" style={{ opacity: 0.8, marginBottom: '0.75rem' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem' }}>Belum Ada Modul</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Mulai susun kurikulum Anda dengan menambahkan modul pertama.
          </p>
          <button onClick={handleOpenAddModule} className="btn-primary">
            <Plus size={15} />
            <span>Tambah Modul Sekarang</span>
          </button>
        </div>
      ) : (
        /* Transparent Glass Two-Pane Layout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '1.75rem',
          alignItems: 'start',
        }}>
          {/* ─── Left Pane: Module Navigation (Glass Panel) ─── */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '0.85rem 1.15rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>Daftar Modul</span>
              <span>{modules.length} Modul</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {modules.map((mod, modIdx) => {
                const isSelected = selectedModId === mod.id;
                const lessonCount = mod.lessons?.length || 0;

                return (
                  <div
                    key={mod.id}
                    onClick={() => setSelectedModId(mod.id)}
                    style={{
                      padding: '0.95rem 1.15rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--gold-accent)' : '3px solid transparent',
                      boxShadow: isSelected ? 'inset 0 1px 0 rgba(255, 255, 255, 0.15)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <span className={`pfx-badge ${
                          mod.level === 'Pemula' ? 'pfx-badge-info' : mod.level === 'Menengah' ? 'pfx-badge-gold' : 'pfx-badge-success'
                        }`} style={{ fontSize: '0.65rem', padding: '0.08rem 0.4rem' }}>
                          {mod.level}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          • {lessonCount} Bab
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#FFF' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {mod.title}
                      </div>
                    </div>

                    {/* Order buttons */}
                    <div style={{ display: 'flex', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveModule(modIdx, 'up')}
                        disabled={modIdx === 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: modIdx === 0 ? 'rgba(255, 255, 255, 0.05)' : 'var(--text-dim)',
                          cursor: modIdx === 0 ? 'default' : 'pointer',
                          padding: '2px',
                        }}
                        title="Geser Naik"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => handleMoveModule(modIdx, 'down')}
                        disabled={modIdx === modules.length - 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: modIdx === modules.length - 1 ? 'rgba(255, 255, 255, 0.05)' : 'var(--text-dim)',
                          cursor: modIdx === modules.length - 1 ? 'default' : 'pointer',
                          padding: '2px',
                        }}
                        title="Geser Turun"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Right Pane: Selected Module Detail & Lessons Table (Glass Panel) ─── */}
          {selectedModule && (
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              {/* Module Header Strip */}
              <div style={{
                padding: '1.35rem 1.6rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{selectedModule.title}</h2>
                    <span className={`pfx-badge ${
                      selectedModule.level === 'Pemula' ? 'pfx-badge-info' : selectedModule.level === 'Menengah' ? 'pfx-badge-gold' : 'pfx-badge-success'
                    }`}>
                      {selectedModule.level}
                    </span>
                  </div>
                  {selectedModule.subtitle && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      {selectedModule.subtitle}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <span className="pfx-badge pfx-badge-neutral" style={{ fontSize: '0.72rem', alignSelf: 'center' }}>
                    Materi Permanen
                  </span>
                  <button
                    onClick={() => setDeleteConfirm({ type: 'module', id: selectedModule.id, name: selectedModule.title })}
                    className="btn-danger-ghost"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              {/* Lessons Toolbar */}
              <div style={{
                padding: '0.9rem 1.6rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Bab Pembelajaran ({selectedModule.lessons?.length || 0})
                </div>
                <button
                  onClick={handleOpenAddLesson}
                  className="btn-primary"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                >
                  <Plus size={14} />
                  <span>Tambah Bab</span>
                </button>
              </div>

              {/* Lessons List Table */}
              {(!selectedModule.lessons || selectedModule.lessons.length === 0) ? (
                <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Belum ada bab materi dalam modul ini. Tekan tombol Tambah Bab untuk membuat materi.
                </div>
              ) : (
                <table className="pfx-table">
                  <thead>
                    <tr>
                      <th style={{ width: '65px' }}>Urutan</th>
                      <th>Judul Bab</th>
                      <th style={{ width: '120px' }}>Durasi</th>
                      <th style={{ width: '130px' }}>Video YouTube</th>
                      <th style={{ textAlign: 'right', width: '180px' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedModule.lessons.map((les, lesIdx) => {
                      const videoCount = les.youtube_urls?.length || 0;

                      return (
                        <tr key={les.id}>
                          {/* Order with subtle buttons */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', width: '18px' }}>
                                #{lesIdx + 1}
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <button
                                  onClick={() => handleMoveLesson(lesIdx, 'up')}
                                  disabled={lesIdx === 0}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: lesIdx === 0 ? 'rgba(255, 255, 255, 0.05)' : 'var(--text-dim)',
                                    cursor: lesIdx === 0 ? 'default' : 'pointer',
                                    padding: '1px',
                                  }}
                                  title="Geser Naik"
                                >
                                  <ArrowUp size={11} />
                                </button>
                                <button
                                  onClick={() => handleMoveLesson(lesIdx, 'down')}
                                  disabled={lesIdx === selectedModule.lessons!.length - 1}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: lesIdx === selectedModule.lessons!.length - 1 ? 'rgba(255, 255, 255, 0.05)' : 'var(--text-dim)',
                                    cursor: lesIdx === selectedModule.lessons!.length - 1 ? 'default' : 'pointer',
                                    padding: '1px',
                                  }}
                                  title="Geser Turun"
                                >
                                  <ArrowDown size={11} />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Title */}
                          <td>
                            <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{les.title}</div>
                          </td>

                          {/* Duration */}
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <Clock size={12} /> {les.minutes} menit
                            </span>
                          </td>

                          {/* YouTube Videos */}
                          <td>
                            {videoCount > 0 ? (
                              <span className="pfx-badge pfx-badge-info" style={{ fontSize: '0.72rem' }}>
                                <Video size={11} /> {videoCount} Video
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Teks Murni</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => {
                                  setPreviewLesson(les);
                                  setPreviewVideoIdx(0);
                                }}
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                title="Pratinjau Materi"
                              >
                                <Eye size={12} />
                                <span>Preview</span>
                              </button>

                              <button
                                onClick={() => setDeleteConfirm({ type: 'lesson', id: les.id, name: les.title })}
                                className="btn-danger-ghost"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                title="Hapus Bab"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: Tambah / Edit Modul (Frosted Glass Panel) ─── */}
      {showModModal && (
        <div className="pfx-modal-backdrop" onClick={() => setShowModModal(false)}>
          <div className="pfx-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
                Tambah Modul Baru
              </h2>
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
                  placeholder="Contoh: Fondasi Pasar Forex & Karakter Pair"
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
                  placeholder="Contoh: Pengenalan struktur pasar, sesi trading Tokyo/London/NY"
                  value={modSubtitle}
                  onChange={(e) => setModSubtitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="pfx-label">Tingkat (Level)</label>
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
                  <label className="pfx-label">Ikon (Ionicons)</label>
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
                  <span>{actionLoading ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Tambah / Edit Bab (Frosted Glass Panel) ─── */}
      {showLesModal && (
        <div className="pfx-modal-backdrop" onClick={() => setShowLesModal(false)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
                Tambah Bab Baru
              </h2>
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
                    placeholder="Contoh: Sesi London Breakout & Entry Rule"
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
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lesUrls.length} Video Ditambahkan</span>
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
                    <span>Tambah</span>
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
                              #{idx + 1}: {url} (ID: {ytid})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVideoUrl(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
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
                <label className="pfx-label">Naskah Pembelajaran &amp; Panduan</label>
                <textarea
                  className="pfx-textarea"
                  style={{ minHeight: '160px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                  placeholder="Ketik materi pembelajaran lengkap di sini..."
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

      {/* ─── MODAL: Pratinjau Bab (Frosted Glass Panel) ─── */}
      {previewLesson && (
        <div className="pfx-modal-backdrop" onClick={() => setPreviewLesson(null)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span className="pfx-badge pfx-badge-gold" style={{ fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                  Pratinjau Siswa
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{previewLesson.title}</h2>
              </div>
              <button onClick={() => setPreviewLesson(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Video Player */}
            {previewLesson.youtube_urls && previewLesson.youtube_urls.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                {previewLesson.youtube_urls.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', overflowX: 'auto' }}>
                    {previewLesson.youtube_urls.map((_, vIdx) => (
                      <button
                        key={vIdx}
                        onClick={() => setPreviewVideoIdx(vIdx)}
                        className={previewVideoIdx === vIdx ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem' }}
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
                      boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
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
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              padding: '1.35rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              lineHeight: 1.6,
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}>
              {previewLesson.content || 'Belum ada konten tertulis untuk bab ini.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setPreviewLesson(null)} className="btn-secondary">
                Tutup
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

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Hapus {deleteConfirm.type === 'module' ? 'Modul' : 'Bab'}?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Tindakan ini tidak dapat dibatalkan. "{deleteConfirm.name}" akan dihapus permanen.
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
