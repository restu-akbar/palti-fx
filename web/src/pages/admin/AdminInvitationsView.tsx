import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, KeyRound, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { AdminInvitationsService, INVITE_CODE_MIN_LENGTH, normalizeInviteCode, type InviteCodeStatus } from '../../lib/adminInvitations';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

const card: React.CSSProperties = {
  padding: '1.5rem',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'rgba(13, 17, 24, 0.65)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  marginBottom: '1.5rem',
};

export const AdminInvitationsView: React.FC = () => {
  const [status, setStatus] = useState<InviteCodeStatus>({ active: false, updatedAt: null });
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    AdminInvitationsService.getStatus().then((s) => {
      setStatus(s);
      setLoading(false);
    });
  }, []);

  const tooShort = code.trim() !== '' && normalizeInviteCode(code).length < INVITE_CODE_MIN_LENGTH;

  const handleSave = async () => {
    if (status.active && !window.confirm('Kode lama akan langsung tidak berlaku. Ganti kode undangan sekarang?')) return;
    setSaving(true);
    setFeedback(null);
    const res = await AdminInvitationsService.setCode(code);
    setSaving(false);
    if (!res.success) {
      setFeedback({ text: res.error || 'Gagal menyimpan kode undangan.', error: true });
      return;
    }
    setStatus({ active: true, updatedAt: res.updatedAt ?? null });
    setSavedCode(res.code ?? null);
    setCopied(false);
    setCode('');
    setFeedback({ text: 'Kode undangan berhasil diganti. Kode lama sudah tidak berlaku.', error: false });
  };

  const handleCopy = async () => {
    if (!savedCode) return;
    try {
      await navigator.clipboard.writeText(savedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFeedback({ text: 'Gagal menyalin. Salin kode secara manual.', error: true });
    }
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* ─── Header ─── */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--gold-accent)' }}>02</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
            Akses Privat &amp; Keanggotaan VIP
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#FFF', letterSpacing: '-0.02em', margin: 0 }}>Kode Undangan PALTI FX</h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.45rem', lineHeight: 1.55 }}>
          Satu kode untuk semua calon member dan bisa dipakai berkali-kali. Mengganti kode langsung menimpa kode lama.
        </p>
      </div>

      {feedback && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            backgroundColor: feedback.error ? 'var(--danger-bg)' : 'var(--success-bg)',
            border: `1px solid ${feedback.error ? 'var(--danger-border)' : 'var(--success-border)'}`,
            color: feedback.error ? '#FDA4AF' : '#6EE7B7',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          {feedback.error ? <AlertTriangle size={16} /> : <Check size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ─── Status ─── */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-accent)',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={20} />
        </div>
        <div style={{ fontSize: '0.86rem', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: '#FFF' }}>
            {loading ? 'Memuat status…' : status.active ? 'Kode undangan aktif' : 'Belum ada kode undangan'}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {status.active
              ? `Terakhir diganti ${formatDate(status.updatedAt)}. Kode tersimpan terenkripsi (hash), jadi tidak bisa ditampilkan ulang.`
              : 'Calon member belum bisa mengaktifkan akun sampai kode dibuat.'}
          </div>
        </div>
      </div>

      {/* ─── Kode baru (tampil sekali) ─── */}
      {savedCode && (
        <div style={{ ...card, border: '1px solid rgba(212, 175, 55, 0.35)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Kode undangan baru — salin sekarang, tidak akan ditampilkan lagi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <code style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--gold-accent)', wordBreak: 'break-all' }}>{savedCode}</code>
            <button onClick={handleCopy} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Form ganti kode ─── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#FFF', marginBottom: '0.9rem' }}>
          <KeyRound size={17} />
          <span>{status.active ? 'Ganti kode undangan' : 'Buat kode undangan'}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            className="pfx-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Kosongkan untuk kode acak"
            maxLength={40}
            style={{ flex: '1 1 240px', fontFamily: 'monospace', letterSpacing: '0.06em' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !saving && !tooShort) handleSave();
            }}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setCode(AdminInvitationsService.generateRandomCode())}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}
          >
            <Sparkles size={15} />
            <span>Acak</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || tooShort}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem' }}
          >
            <RefreshCw size={15} />
            <span>{saving ? 'Menyimpan…' : 'Simpan kode'}</span>
          </button>
        </div>
        <div style={{ fontSize: '0.78rem', color: tooShort ? '#FDA4AF' : 'var(--text-dim)', marginTop: '0.6rem' }}>
          Minimal {INVITE_CODE_MIN_LENGTH} karakter. Spasi dan tanda hubung diabaikan, huruf besar/kecil tidak berpengaruh.
        </div>
      </div>
    </div>
  );
};
