import { useEffect, useState } from 'react';
import { 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw, 
  Sparkles,
  X
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

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

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

  const handleDelete = async (id: string, label: string) => {
    if (!window.confirm(`Hapus kode undangan "${label}"?`)) return;

    setActionLoading(true);
    const res = await AdminInvitationsService.deleteInvitation(id);
    if (res.success) {
      notify(`Kode undangan berhasil dihapus.`);
      fetchInvitations();
    } else {
      notify(res.error || 'Gagal menghapus kode.', true);
    }
    setActionLoading(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>
            Kode Undangan VIP
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Penerbitan kode aktivasi aman untuk calon Member (disimpan dalam bentuk hash SHA-256). Admin tidak memerlukan kode undangan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchInvitations} className="btn-secondary" disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
          <button onClick={handleOpenCreate} className="btn-primary">
            <Plus size={15} />
            <span>Terbitkan Kode</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: '0.65rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.25rem',
          backgroundColor: feedbackMsg.error ? 'var(--danger-bg)' : 'var(--success-bg)',
          border: `1px solid ${feedbackMsg.error ? 'var(--danger-border)' : 'var(--success-border)'}`,
          color: feedbackMsg.error ? '#FDA4AF' : '#6EE7B7',
          fontSize: '0.84rem',
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Invitations Table */}
      <div className="pfx-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Memuat daftar kode undangan...
          </div>
        ) : invitations.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Belum ada kode undangan yang diterbitkan.
          </div>
        ) : (
          <table className="pfx-table">
            <thead>
              <tr>
                <th>Petunjuk Kode</th>
                <th>Hash SHA-256 (Tersimpan)</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Dibuat</th>
                <th style={{ textAlign: 'right', width: '80px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => {
                const isUsed = inv.is_used || !!inv.used_at;
                const displayLabel = inv.code_hint || 'Kode VIP';
                const isCopied = copiedCode === displayLabel;

                return (
                  <tr key={inv.id}>
                    {/* Code Hint */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--gold-hover)',
                          letterSpacing: '0.04em',
                        }}>
                          {displayLabel}
                        </span>
                        <button
                          onClick={() => handleCopy(displayLabel)}
                          className="btn-secondary"
                          style={{
                            padding: '2px 5px',
                            fontSize: '0.7rem',
                            color: isCopied ? 'var(--success)' : 'var(--text-dim)',
                          }}
                          title="Salin Petunjuk Kode"
                        >
                          {isCopied ? <Check size={11} /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>

                    {/* Hash */}
                    <td>
                      <span
                        title={inv.code_hash}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: 'var(--text-dim)',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {inv.code_hash ? `${inv.code_hash.slice(0, 10)}...${inv.code_hash.slice(-8)}` : '-'}
                      </span>
                    </td>

                    {/* Role */}
                    <td>
                      <span className={`pfx-badge ${inv.role === 'admin' ? 'pfx-badge-gold' : 'pfx-badge-neutral'}`}>
                        {inv.role.toUpperCase()}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      {isUsed ? (
                        <span className="pfx-badge pfx-badge-neutral">Sudah Digunakan</span>
                      ) : (
                        <span className="pfx-badge pfx-badge-success">Tersedia</span>
                      )}
                    </td>

                    {/* Created */}
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(inv.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Delete */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(inv.id, displayLabel)}
                        className="btn-danger-ghost"
                        style={{ padding: '3px 7px' }}
                        title="Hapus Kode"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── MODAL: Terbitkan Kode Baru ─── */}
      {showCreateModal && (
        <div className="pfx-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="pfx-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Terbitkan Kode Undangan VIP</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvitation}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="pfx-label">Kode Undangan</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    className="pfx-input"
                    placeholder="PFX-VIP-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setCode(AdminInvitationsService.generateRandomCode())}
                    className="btn-secondary"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Sparkles size={13} />
                    <span>Acak</span>
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="pfx-label">Label / Petunjuk Tampilan (Opsional)</label>
                <input
                  type="text"
                  className="pfx-input"
                  placeholder="Misal: Undangan VIP Batch 1"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                />
              </div>

              <div style={{
                marginBottom: '1.5rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Hak Akses Undangan</span>
                  <span className="pfx-badge pfx-badge-neutral">MEMBER (TRADER)</span>
                </div>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.45 }}>
                  Kode undangan dikhususkan untuk calon Member biasa. Akun Administrator tidak memerlukan kode undangan.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  <Check size={14} />
                  <span>{actionLoading ? 'Menerbitkan...' : 'Terbitkan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL SUKSES: Tampilkan Kode Mentah untuk Disalin ─── */}
      {createdResult && (
        <div className="pfx-modal-backdrop" onClick={() => setCreatedResult(null)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '440px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <Check size={24} />
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Kode Undangan Berhasil Dibuat
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Kode ini disimpan dalam bentuk hash SHA-256 demi keamanan. Salin kode ini sekarang dan berikan kepada calon {createdResult.role}.
            </p>

            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(217, 180, 110, 0.08)',
              border: '1px dashed var(--gold-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--gold-light)',
                letterSpacing: '0.06em',
              }}>
                {createdResult.rawCode}
              </span>
              <button
                onClick={() => handleCopy(createdResult.rawCode)}
                className="btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              >
                {copiedCode === createdResult.rawCode ? (
                  <>
                    <Check size={13} />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setCreatedResult(null)}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
