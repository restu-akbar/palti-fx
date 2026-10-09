import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw, 
  Sparkles,
  X,
  KeyRound,
  ShieldCheck,
  Search,
  Lock,
  Clock
} from 'lucide-react';
import type { Invitation } from '../../types/admin';
import { AdminInvitationsService } from '../../lib/adminInvitations';

export const AdminInvitationsView: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [hint, setHint] = useState('');

  // Success Modal State setelah terbit
  const [createdResult, setCreatedResult] = useState<{ rawCode: string; role: string } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'used'>('all');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Delete Safeguard Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; label: string } | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const data = await AdminInvitationsService.getInvitations();
      setInvitations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const notify = (text: string, error?: boolean) => {
    setFeedbackMsg({ text, error });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Metrics
  const activeCount = useMemo(() => {
    return invitations.filter((inv) => !inv.is_used && !inv.used_at).length;
  }, [invitations]);

  const usedCount = useMemo(() => {
    return invitations.filter((inv) => inv.is_used || !!inv.used_at).length;
  }, [invitations]);

  // Filtered invitations list
  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      const isUsed = inv.is_used || !!inv.used_at;
      
      // Filter by status
      if (statusFilter === 'available' && isUsed) return false;
      if (statusFilter === 'used' && !isUsed) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const hintText = (inv.code_hint || '').toLowerCase();
        const hashText = (inv.code_hash || '').toLowerCase();
        return hintText.includes(query) || hashText.includes(query);
      }

      return true;
    });
  }, [invitations, statusFilter, searchQuery]);

  const handleOpenCreate = () => {
    const random = AdminInvitationsService.generateRandomCode();
    setCode(random);
    setHint('');
    setShowCreateModal(true);
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      notify('Kode undangan tidak boleh kosong.', true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await AdminInvitationsService.createInvitation({
        code,
        role: 'member',
        hint: hint.trim() || undefined,
      });

      if (!res.success) {
        notify(res.error || 'Gagal menerbitkan kode.', true);
      } else {
        setShowCreateModal(false);
        setCreatedResult({
          rawCode: res.rawCode || code,
          role: 'member',
        });
        fetchInvitations();
      }
    } catch (err: any) {
      notify(err?.message || 'Terjadi kesalahan.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);

    const res = await AdminInvitationsService.deleteInvitation(deleteConfirm.id);
    if (res.success) {
      notify(`Kode undangan berhasil dihapus.`);
      fetchInvitations();
    } else {
      notify(res.error || 'Gagal menghapus kode.', true);
    }
    setActionLoading(false);
    setDeleteConfirm(null);
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', paddingBottom: '4rem' }}>
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
              02
            </span>
            <span style={{ width: '22px', height: '1px', background: 'var(--gold-border)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
              Akses Privat &amp; Keanggotaan
            </span>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 600, color: '#FFF', letterSpacing: '-0.02em' }}>
            Kode Undangan VIP PALTI FX
          </h1>

          {/* Natural Text Metrics Bar (Tanpa Card) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.55rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span>
              <strong style={{ color: '#FFF', fontWeight: 600 }}>{invitations.length}</strong> Total Diterbitkan
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span>
              <strong style={{ color: 'var(--success)', fontWeight: 600 }}>{activeCount}</strong> Kuota Tersedia
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span>
              <strong style={{ color: 'var(--text-dim)', fontWeight: 600 }}>{usedCount}</strong> Telah Digunakan
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button 
            onClick={fetchInvitations} 
            className="btn-secondary" 
            style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem' }}
            disabled={loading}
            title="Segarkan daftar kode"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
          
          <button 
            onClick={handleOpenCreate} 
            className="btn-primary"
            style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
          >
            <Plus size={15} />
            <span>Terbitkan Kode Baru</span>
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

      {/* ─── Filter & Search Bar (Frosted Glass Card) ─── */}
      <div className="pfx-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '0.85rem 1.15rem',
        flexWrap: 'wrap',
      }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => setStatusFilter('all')}
            className={statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem' }}
          >
            Semua ({invitations.length})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={statusFilter === 'available' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem' }}
          >
            Tersedia ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('used')}
            className={statusFilter === 'used' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem' }}
          >
            Digunakan ({usedCount})
          </button>
        </div>

        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: '240px',
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
              placeholder="Cari petunjuk kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.1rem', fontSize: '0.82rem', paddingRight: '0.75rem' }}
            />
          </div>
        </div>
      </div>

      {/* ─── VIP Access Keys Feed (Frosted Transparent Card) ─── */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Memuat kunci undangan VIP...
        </div>
      ) : filteredInvitations.length === 0 ? (
        <div className="pfx-card" style={{
          padding: '4.5rem 2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            color: 'var(--gold-accent)',
          }}>
            <KeyRound size={18} />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
            {searchQuery || statusFilter !== 'all' ? 'Tidak Ada Kode yang Sesuai' : 'Belum Ada Kode Undangan'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.35rem', maxWidth: '420px', margin: '0 auto 1.35rem' }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Coba ganti kata kunci pencarian atau ubah tab filter status.'
              : 'Terbitkan kode undangan VIP pertama untuk memberikan akses bergabung bagi calon trader.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button onClick={handleOpenCreate} className="btn-primary" style={{ fontSize: '0.82rem' }}>
              <Plus size={14} />
              <span>Terbitkan Kode Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="pfx-card" style={{ overflow: 'hidden' }}>
          {filteredInvitations.map((inv, invIdx) => {
            const isUsed = inv.is_used || !!inv.used_at;
            const displayLabel = inv.code_hint || 'Kode VIP';
            const isCopied = copiedCode === displayLabel;

            return (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.35rem',
                  borderBottom: invIdx === filteredInvitations.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {/* Sisi Kiri: Nomor Urut Elegan + Kode VIP + Metadata Alami */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                  {/* Nomor Urut Tipografis Alami */}
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: isUsed ? 'var(--text-dim)' : 'var(--gold-accent)',
                    opacity: isUsed ? 0.45 : 0.85,
                    width: '28px',
                    paddingTop: '2px',
                    flexShrink: 0,
                  }}>
                    {String(invIdx + 1).padStart(2, '0')}
                  </div>

                  {/* Code Details & Security Metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: isUsed ? 'var(--text-secondary)' : '#FFF',
                        letterSpacing: '0.04em',
                      }}>
                        {displayLabel}
                      </span>

                      {/* Quick Copy Button */}
                      <button
                        onClick={() => handleCopy(displayLabel)}
                        className="btn-secondary"
                        style={{
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.72rem',
                          color: isCopied ? 'var(--success)' : 'var(--text-dim)',
                          gap: '0.3rem',
                        }}
                        title="Salin Kode Undangan"
                      >
                        {isCopied ? (
                          <>
                            <Check size={11} color="var(--success)" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      {/* Status Indicator Halus */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        color: isUsed ? 'var(--text-dim)' : 'var(--success)',
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isUsed ? 'var(--text-dim)' : 'var(--success)',
                          boxShadow: isUsed ? 'none' : '0 0 6px rgba(52, 211, 153, 0.45)',
                        }} />
                        <span>{isUsed ? 'Telah Digunakan' : 'Tersedia'}</span>
                      </span>

                      {/* Role Pill */}
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 500,
                        color: 'var(--text-dim)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}>
                        MEMBER VIP
                      </span>
                    </div>

                    {/* Meta bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.78rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
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

                      <span style={{ color: 'rgba(255, 255, 255, 0.12)' }}>•</span>

                      {/* SHA-256 Hash indicator */}
                      <span 
                        title={`Hash SHA-256: ${inv.code_hash}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'help' }}
                      >
                        <Lock size={11} />
                        <span>SHA-256 Protected</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sisi Kanan: Aksi Hapus */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                  <button
                    onClick={() => setDeleteConfirm({ id: inv.id, label: displayLabel })}
                    className="btn-danger-ghost"
                    style={{ fontSize: '0.76rem', padding: '0.4rem 0.65rem' }}
                    title="Hapus Kode Undangan"
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: Terbitkan Kode Baru (Bersih & Elegan) ─── */}
      {showCreateModal && (
        <div className="pfx-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="pfx-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Akses Registrasi
                </span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFF' }}>
                  Terbitkan Kode Undangan VIP
                </h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvitation}>
              <div style={{ marginBottom: '1.15rem' }}>
                <label className="pfx-label">Kode Undangan Eksklusif</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="pfx-input"
                    placeholder="PFX-VIP-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.95rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setCode(AdminInvitationsService.generateRandomCode())}
                    className="btn-secondary"
                    style={{ whiteSpace: 'nowrap', gap: '0.35rem' }}
                    title="Buat kode acak"
                  >
                    <Sparkles size={13} color="var(--gold-accent)" />
                    <span>Acak</span>
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="pfx-label">Label / Catatan Calon Member (Opsional)</label>
                <input
                  type="text"
                  className="pfx-input"
                  placeholder="Misal: Undangan VIP Pak Budi (Batch London)"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                />
              </div>

              {/* Informational Box */}
              <div style={{
                marginBottom: '1.75rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.035)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                  <ShieldCheck size={14} color="var(--gold-accent)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFF' }}>
                    Keamanan Hash Kriptografi SHA-256
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Kode undangan disimpan dalam format hash kriptografi satu arah di Supabase Cloud. Sistem menjamin kerahasiaan penuh kode registrasi calon member.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  <Check size={14} />
                  <span>{actionLoading ? 'Menerbitkan...' : 'Terbitkan Kunci Akses'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL SUKSES: Tiket Digital Kode Undangan VIP ─── */}
      {createdResult && (
        <div className="pfx-modal-backdrop" onClick={() => setCreatedResult(null)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '440px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <Check size={22} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', marginBottom: '0.35rem' }}>
              Kode Undangan VIP Terbit
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Salin kode voucher di bawah dan kirimkan langsung kepada calon member untuk pendaftaran di aplikasi mobile PALTI FX.
            </p>

            {/* VIP Digital Key Card */}
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(207, 168, 94, 0.06)',
              border: '1px solid var(--gold-border)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.85rem',
              marginBottom: '1.5rem',
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--gold-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                PALTI FX VIP ACCESS KEY
              </span>

              <span style={{
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#FFF',
                letterSpacing: '0.08em',
              }}>
                {createdResult.rawCode}
              </span>

              <button
                onClick={() => handleCopy(createdResult.rawCode)}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.84rem' }}
              >
                {copiedCode === createdResult.rawCode ? (
                  <>
                    <Check size={14} />
                    <span>Kode Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Salin Kode Undangan</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setCreatedResult(null)}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Selesai &amp; Tutup
            </button>
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
              <Trash2 size={18} color="var(--danger)" />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
              Hapus Kode Undangan?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Kode "{deleteConfirm.label}" akan dihapus permanen. Calon member tidak akan dapat menggunakannya lagi untuk mendaftar.
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
