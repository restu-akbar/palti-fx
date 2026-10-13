import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  KeyRound,
  ShieldCheck,
  Search,
  Clock,
  Ban,
  AlertTriangle,
  Sparkles,
  X
} from 'lucide-react';
import type { Invitation } from '../../types/admin';
import { AdminInvitationsService } from '../../lib/adminInvitations';

/**
 * Menentukan status keamanan kunci undangan:
 * - 'active': Aktif (Kunci valid & siap digunakan untuk pendaftaran)
 * - 'expired': Kedaluwarsa (Kunci telah digunakan atau dinonaktifkan/hangus)
 */
function getInvitationStatus(inv: Invitation): 'active' | 'expired' {
  if (inv.is_used || !!inv.used_at) return 'expired';
  return 'active';
}

/**
 * Membersihkan label calon member dari tag internal sistem seperti [LAPUR]
 */
function getCleanLabel(inv: Invitation): string {
  if (!inv.code_hint || !inv.code_hint.trim()) {
    return 'Calon Member VIP';
  }
  const cleaned = inv.code_hint
    .replace(/^\[LAPUR\s*\/?\s*DIGANTI\]\s*/i, '')
    .replace(/^\[LAPUR\]\s*/i, '')
    .replace(/^\[EXPIRED\]\s*/i, '')
    .trim();
    
  return cleaned || 'Calon Member VIP';
}

export const AdminInvitationsView: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Terbitkan Baru
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [memberLabel, setMemberLabel] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [customCode, setCustomCode] = useState('');

  // Modal Sukses (One-Time Secret Key View)
  const [createdResult, setCreatedResult] = useState<{
    rawCode: string;
    label: string;
  } | null>(null);

  // Modal Nonaktifkan / Hanguskan
  const [revokeConfirm, setRevokeConfirm] = useState<{
    id: string;
    label: string;
  } | null>(null);

  // Modal Hapus Arsip
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    label: string;
  } | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const data = await AdminInvitationsService.getInvitations();
      setInvitations(data);
    } catch (err) {
      console.error('[AdminInvitationsView.fetchInvitations]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    const handleFocus = () => fetchInvitations();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const notify = (text: string, error?: boolean) => {
    setFeedbackMsg({ text, error });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Metrik: Hanya Aktif & Kedaluwarsa
  const activeCount = useMemo(() => {
    return invitations.filter((inv) => getInvitationStatus(inv) === 'active').length;
  }, [invitations]);

  const expiredCount = useMemo(() => {
    return invitations.filter((inv) => getInvitationStatus(inv) === 'expired').length;
  }, [invitations]);

  // Filtered List
  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      const status = getInvitationStatus(inv);
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const label = getCleanLabel(inv).toLowerCase();
        const rawHint = (inv.code_hint || '').toLowerCase();
        const hash = (inv.code_hash || '').toLowerCase();
        return label.includes(q) || rawHint.includes(q) || hash.includes(q);
      }

      return true;
    });
  }, [invitations, statusFilter, searchQuery]);

  /* ─── Handlers ─── */
  const handleOpenCreate = () => {
    setMemberLabel('');
    setCustomCode('');
    setUseCustomCode(false);
    setShowCreateModal(true);
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberLabel.trim()) {
      notify('Label / Catatan Calon Member wajib diisi sebagai identitas pengenal.', true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await AdminInvitationsService.createInvitation({
        label: memberLabel.trim(),
        code: useCustomCode && customCode.trim() ? customCode.trim() : undefined,
        role: 'member',
      });

      if (!res.success) {
        notify(res.error || 'Gagal menerbitkan kunci akses VIP.', true);
      } else {
        setShowCreateModal(false);
        setCreatedResult({
          rawCode: res.rawCode!,
          label: memberLabel.trim(),
        });
        fetchInvitations();
        notify(`Kunci akses VIP untuk "${memberLabel.trim()}" berhasil diterbitkan.`);
      }
    } catch (err: any) {
      notify(err?.message || 'Terjadi kesalahan sistem.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const executeRevoke = async () => {
    if (!revokeConfirm) return;
    setActionLoading(true);

    try {
      const res = await AdminInvitationsService.revokeInvitation(revokeConfirm.id, revokeConfirm.label);
      if (res.success) {
        notify(`Kunci undangan untuk "${revokeConfirm.label}" telah dinonaktifkan (kedaluwarsa).`);
        fetchInvitations();
      } else {
        notify(res.error || 'Gagal menonaktifkan kunci undangan.', true);
      }
    } catch (err: any) {
      notify(err?.message || 'Terjadi kesalahan.', true);
    } finally {
      setActionLoading(false);
      setRevokeConfirm(null);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);

    try {
      const res = await AdminInvitationsService.deleteInvitation(deleteConfirm.id);
      if (res.success) {
        notify(`Data kunci "${deleteConfirm.label}" berhasil dihapus.`);
        fetchInvitations();
      } else {
        notify(res.error || 'Gagal menghapus data.', true);
      }
    } catch (err: any) {
      notify(err?.message || 'Terjadi kesalahan.', true);
    } finally {
      setActionLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2400);
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* ─── Editorial Header ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        flexWrap: 'wrap',
        gap: '1.25rem',
      }}>
        <div>
          {/* Section Marker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--gold-accent)' }}>
              02
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
              Akses Privat &amp; Keanggotaan VIP
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#FFF', letterSpacing: '-0.02em', margin: 0 }}>
            Kode Undangan VIP PALTI FX
          </h1>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.45rem', maxWidth: '640px', lineHeight: 1.55 }}>
            Sistem manajemen kunci akses registrasi member eksklusif. Kode dienkripsi permanen dan identitas pelacakan menggunakan Label / Catatan Calon Member.
          </p>

          {/* Quick Metrics Bar: Hanya Aktif & Kedaluwarsa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span>
              <strong style={{ color: '#FFF', fontWeight: 600 }}>{invitations.length}</strong> Total Diterbitkan
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span>
              <strong style={{ color: 'var(--success)', fontWeight: 600 }}>{activeCount}</strong> Aktif
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span>
              <strong style={{ color: 'var(--danger)', fontWeight: 600 }}>{expiredCount}</strong> Kedaluwarsa
            </span>
          </div>
        </div>

        <div>
          <button 
            onClick={handleOpenCreate} 
            className="btn-primary"
            style={{ fontSize: '0.84rem', padding: '0.6rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            <span>Terbitkan Kunci Akses Baru</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.75rem',
          backgroundColor: feedbackMsg.error ? 'var(--danger-bg)' : 'var(--success-bg)',
          border: `1px solid ${feedbackMsg.error ? 'var(--danger-border)' : 'var(--success-border)'}`,
          color: feedbackMsg.error ? '#FDA4AF' : '#6EE7B7',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          {feedbackMsg.error ? <AlertTriangle size={16} /> : <Check size={16} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ─── Security Protocol Architecture Banner ─── */}
      <div style={{
        marginBottom: '1.75rem',
        padding: '1.15rem 1.35rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(13, 17, 24, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(212, 175, 55, 0.18)',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold-accent)',
          flexShrink: 0,
          marginTop: '2px',
        }}>
          <ShieldCheck size={18} />
        </div>
        <div style={{ flex: 1, fontSize: '0.82rem', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: '#FFF', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span>Sistem Kunci Akses Terenkripsi</span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Kode akses hanya ditampilkan <strong>1 kali saat diterbitkan</strong> kepada admin. Identitas pelacakan menggunakan nama/catatan calon member. Kunci yang telah dinonaktifkan atau telah digunakan berstatus <strong>Kedaluwarsa</strong> dan tidak dapat digunakan lagi.
          </p>
        </div>
      </div>

      {/* ─── Filter & Search Bar: Hanya Semua, Aktif, Kedaluwarsa ─── */}
      <div className="pfx-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '0.85rem 1.15rem',
        flexWrap: 'wrap',
      }}>
        {/* Status Filters: Semua, Aktif, Kedaluwarsa */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStatusFilter('all')}
            className={statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem' }}
          >
            Semua ({invitations.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={statusFilter === 'active' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem' }}
          >
            Aktif ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={statusFilter === 'expired' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem' }}
          >
            Kedaluwarsa ({expiredCount})
          </button>
        </div>

        {/* Search Input by Label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: '270px',
        }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={13} 
              color="var(--text-dim)" 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              className="pfx-input"
              placeholder="Cari label / catatan calon member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.1rem', fontSize: '0.82rem', paddingRight: '2rem' }}
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
                  padding: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Cards Grid Layout (Clean & Minimalist) ─── */}
      {loading ? (
        <div style={{ padding: '4.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2px solid rgba(212, 175, 55, 0.2)',
            borderTopColor: 'var(--gold-accent)',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <span>Memuat data kunci undangan VIP...</span>
        </div>
      ) : filteredInvitations.length === 0 ? (
        <div className="pfx-card" style={{
          padding: '4.5rem 2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.15rem',
            color: 'var(--gold-accent)',
          }}>
            <KeyRound size={20} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
            {searchQuery || statusFilter !== 'all' ? 'Tidak Ada Kunci yang Sesuai' : 'Belum Ada Kunci Undangan'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.55 }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Coba gunakan kata kunci pencarian lainnya atau ubah tab status di atas.'
              : 'Terbitkan kunci akses VIP pertama untuk calon trader dengan mencantumkan label atau nama calon member.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button onClick={handleOpenCreate} className="btn-primary" style={{ fontSize: '0.84rem' }}>
              <Plus size={15} />
              <span>Terbitkan Kunci Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
          gap: '1.2rem',
        }}>
          {filteredInvitations.map((inv, idx) => {
            const status = getInvitationStatus(inv);
            const label = getCleanLabel(inv);
            const isActive = status === 'active';

            return (
              <div
                key={inv.id}
                className="pfx-card"
                style={{
                  padding: '1.25rem 1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  position: 'relative',
                  overflow: 'hidden',
                  borderColor: isActive 
                    ? 'rgba(52, 211, 153, 0.22)' 
                    : 'rgba(239, 68, 68, 0.16)',
                  backgroundColor: isActive
                    ? 'rgba(12, 19, 20, 0.65)'
                    : 'rgba(20, 13, 15, 0.55)',
                }}
              >
                {/* ─── Header: Label Calon Member ─── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  {/* Icon status */}
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: isActive 
                      ? 'rgba(52, 211, 153, 0.1)' 
                      : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${
                      isActive 
                        ? 'rgba(52, 211, 153, 0.25)' 
                        : 'rgba(239, 68, 68, 0.25)'
                    }`,
                    color: isActive ? 'var(--success)' : 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isActive ? <KeyRound size={18} /> : <Ban size={18} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      Calon Member VIP #{String(idx + 1).padStart(2, '0')}
                    </div>
                    <h3 style={{
                      fontSize: '1.08rem',
                      fontWeight: 600,
                      color: isActive ? '#FFF' : 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.35,
                      wordBreak: 'break-word',
                    }}>
                      {label}
                    </h3>
                  </div>
                </div>

                {/* ─── Metadata Row: Tanggal Terbit & Riwayat ─── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingTop: '0.15rem',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={11} />
                    <span>
                      Diterbitkan {new Date(inv.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>

                  {inv.used_at && (
                    <>
                      <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
                      <span>
                        Kedaluwarsa pada{' '}
                        {new Date(inv.used_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </>
                  )}
                </div>

                {/* ─── Action Buttons: Nonaktifkan & Hapus ─── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  marginTop: 'auto',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  {isActive ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setRevokeConfirm({ id: inv.id, label })}
                        className="btn-secondary"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: '#FDA4AF',
                        }}
                        title="Nonaktifkan kunci ini agar tidak dapat digunakan lagi mendaftar"
                      >
                        <Ban size={12} />
                        <span>Nonaktifkan Kunci</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ id: inv.id, label })}
                        className="btn-danger-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem' }}
                        title="Hapus Kunci Undangan"
                      >
                        <Trash2 size={12} />
                        <span>Hapus</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Ban size={12} color="var(--danger)" />
                        <span>Kunci tidak berlaku lagi</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ id: inv.id, label })}
                        className="btn-danger-ghost"
                        style={{ fontSize: '0.74rem', padding: '0.35rem 0.55rem' }}
                        title="Hapus riwayat arsip"
                      >
                        <Trash2 size={12} />
                        <span>Hapus Arsip</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL 1: Terbitkan Kunci Undangan VIP Baru ─── */}
      {showCreateModal && (
        <div className="pfx-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Akses Registrasi VIP
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', margin: '0.2rem 0 0' }}>
                Terbitkan Kunci Undangan VIP
              </h2>
            </div>

            <form onSubmit={handleCreateInvitation}>
              {/* Field 1: Label / Catatan Calon Member (Wajib) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="pfx-label">
                  Label / Catatan Calon Member <span style={{ color: 'var(--gold-accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="pfx-input"
                  placeholder="Contoh: Bpk. Hendra Pratama (Private VIP)"
                  value={memberLabel}
                  onChange={(e) => setMemberLabel(e.target.value)}
                  autoFocus
                  required
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.35rem', display: 'block' }}>
                  Label ini adalah identitas pengenal utama calon member di konsol admin.
                </span>
              </div>

              {/* Field 2: Opsi Format Kode */}
              <div style={{ marginBottom: '1.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="pfx-label" style={{ margin: 0 }}>
                    Format Kode Undangan
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomCode(!useCustomCode)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold-accent)',
                      fontSize: '0.74rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {useCustomCode ? 'Gunakan Acak Otomatis (Rekomendasi)' : 'Ingin Pakai Kode Kustom?'}
                  </button>
                </div>

                {useCustomCode ? (
                  <div>
                    <input
                      type="text"
                      className="pfx-input"
                      placeholder="Contoh: PFX-VIP-LONDON"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.95rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.35rem', display: 'block' }}>
                      Minimal 4 karakter. Spasi dan tanda hubung akan otomatis disesuaikan.
                    </span>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.75rem 0.95rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}>
                    <Sparkles size={15} color="var(--gold-accent)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Kode acak kriptografis <strong>PFX-VIP-XXXXX</strong> akan dibuat secara otomatis.
                    </span>
                  </div>
                )}
              </div>

              {/* Informational Box */}
              <div style={{
                marginBottom: '1.5rem',
                padding: '0.95rem 1.15rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(212, 175, 55, 0.07)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(212, 175, 55, 0.22)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                  <ShieldCheck size={15} color="var(--gold-accent)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFF' }}>
                    Penting: Kode Hanya Ditampilkan 1 Kali
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Kode ini langsung dienkripsi permanen. Setelah diterbitkan, jendela tiket akan menampilkan kode satu kali untuk Anda salin ke calon member.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel">
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  <span>{actionLoading ? 'Menerbitkan...' : 'Terbitkan Kunci Akses'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Single-View Tiket Digital (Tampil 1x Saja) ─── */}
      {createdResult && (
        <div className="pfx-modal-backdrop" onClick={() => setCreatedResult(null)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '460px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.15rem',
            }}>
              <Check size={24} />
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#FFF', marginBottom: '0.35rem' }}>
              Kunci Undangan VIP Terbit
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.45rem', lineHeight: 1.55 }}>
              Kunci akses untuk <strong style={{ color: '#FFF' }}>"{createdResult.label}"</strong> telah siap. Salin kode di bawah dan kirimkan ke calon member sekarang.
            </p>

            {/* VIP Digital Key Card */}
            <div style={{
              padding: '1.4rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(207, 168, 94, 0.08)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(207, 168, 94, 0.35)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.85rem',
              marginBottom: '1.35rem',
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--gold-accent)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
                PALTI FX VIP SECRET ACCESS KEY
              </span>

              <span style={{
                fontFamily: 'monospace',
                fontSize: '1.65rem',
                fontWeight: 700,
                color: '#FFF',
                letterSpacing: '0.08em',
                userSelect: 'all',
              }}>
                {createdResult.rawCode}
              </span>

              <button
                onClick={() => handleCopy(createdResult.rawCode)}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.84rem', padding: '0.65rem 1rem' }}
              >
                {copiedCode === createdResult.rawCode ? (
                  <>
                    <Check size={15} />
                    <span>Kunci Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>Salin Kunci Akses VIP</span>
                  </>
                )}
              </button>
            </div>

            {/* Warning One-Time Display */}
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.22)',
              color: '#FDA4AF',
              fontSize: '0.76rem',
              lineHeight: 1.5,
              textAlign: 'left',
              marginBottom: '1.35rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem',
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>PENTING:</strong> Kode ini <strong>TIDAK AKAN DITAMPILKAN LAGI</strong> setelah jendela ini ditutup demi keamanan. Pastikan Anda telah menyalin dan membagikannya ke calon member. Jika lupa atau hilang, terbitkan kunci baru.
              </div>
            </div>

            <button
              onClick={() => setCreatedResult(null)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '0.6rem 1rem' }}
            >
              Saya Sudah Menyalin Kunci &amp; Tutup
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Nonaktifkan (Kedaluwarsa / Hangus) ─── */}
      {revokeConfirm && (
        <div className="pfx-modal-backdrop" onClick={() => setRevokeConfirm(null)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.15rem',
              color: 'var(--danger)',
            }}>
              <Ban size={20} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
              Nonaktifkan Kunci Undangan?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.35rem', lineHeight: 1.55 }}>
              Kunci untuk <strong style={{ color: '#FFF' }}>"{revokeConfirm.label}"</strong> akan diubah statusnya menjadi <strong>Kedaluwarsa</strong>. Calon member tidak akan dapat menggunakannya lagi untuk registrasi.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem' }}>
              <button onClick={() => setRevokeConfirm(null)} className="btn-cancel">
                Batal
              </button>
              <button onClick={executeRevoke} className="btn-danger-ghost" disabled={actionLoading}>
                <Ban size={13} />
                <span>{actionLoading ? 'Menonaktifkan...' : 'Ya, Nonaktifkan Kunci'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Hapus Arsip ─── */}
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
              margin: '0 auto 1.15rem',
            }}>
              <Trash2 size={18} color="var(--danger)" />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
              Hapus Data Kunci?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Data kunci "{deleteConfirm.label}" akan dihapus permanen dari daftar sistem. Member yang sudah terdaftar sebelumnya tetap aman.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem' }}>
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
    </div>
  );
};
