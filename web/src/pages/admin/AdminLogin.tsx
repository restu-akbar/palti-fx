import { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { AdminAuthService } from '../../lib/adminAuth';
import type { Profile } from '../../types/admin';

interface AdminLoginProps {
  onLoginSuccess: (profile: Profile) => void;
  onBackToLanding: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Silakan lengkapi email dan kata sandi admin.');
      return;
    }

    setLoading(true);
    try {
      const res = await AdminAuthService.loginAdmin(email, password);
      if (!res.success || !res.profile) {
        setErrorMsg(res.error || 'Login gagal.');
      } else {
        onLoginSuccess(res.profile);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillTestAdmin = () => {
    setEmail('dioraput@gmail.com');
    setPassword('admin123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1.5rem',
      backgroundColor: 'var(--bg-deep)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ─── Background Ambient Light ─── */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '1600px',
        height: '1600px',
        background: 'radial-gradient(circle, rgba(207, 168, 94, 0.09) 0%, rgba(207, 168, 94, 0.03) 50%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ─── Colossal Background Logo (Lebih Gede Lagi Banget) ─── */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(1800px, 140vh, 130vw)',
        height: 'min(1800px, 140vh, 130vw)',
        backgroundImage: 'url(/palti-logo.png)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        mixBlendMode: 'screen',
        opacity: 0.16,
        filter: 'drop-shadow(0 0 100px rgba(207, 168, 94, 0.35))',
        pointerEvents: 'none',
        zIndex: 1,
      }} />


      {/* ─── Horizontal Landscape Rectangular Card (Persegi Panjang ke Samping) ─── */}
      <div className="admin-login-landscape" style={{
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'rgba(12, 16, 26, 0.32)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.45), 0 0 50px rgba(207, 168, 94, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
      }}>
        {/* ─── Left Side: Brand Identity & Atmospheric Narrative ─── */}
        <div style={{
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top Brand Header */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '2.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.04em', color: '#FFF' }}>
                  PALTI FX
                </span>
                <span className="pfx-badge pfx-badge-gold" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>
                  ADMIN
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '3px' }}>
                Management Console
              </span>
            </div>

            {/* Narrative & Purpose */}
            <h1 style={{
              fontSize: '1.45rem',
              fontWeight: 600,
              color: '#FFF',
              letterSpacing: '-0.015em',
              lineHeight: 1.35,
              marginBottom: '0.85rem',
            }}>
              Konsol Ekosistem &amp; Kontrol Materi
            </h1>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
            }}>
              Akses privat terpusat untuk authoring silabus modul edukasi, penerbitan batch kode undangan VIP, dan pemantauan akun trader komunitas PALTI FX.
            </p>
          </div>

          {/* Bottom Security Note */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            paddingTop: '2rem',
            marginTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            fontSize: '0.74rem',
            color: 'var(--text-dim)',
          }}>
            <span>Enkripsi Supabase RLS &amp; Hak Akses Terverifikasi</span>
          </div>
        </div>

        {/* ─── Right Side: Clean Elegant Form ─── */}
        <div style={{
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.12)',
        }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', marginBottom: '0.35rem' }}>
              Masuk ke Konsol
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Silakan masukkan kredensial administrator Anda.
            </p>
          </div>

          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.8rem 1rem',
              marginBottom: '1.25rem',
            }}>
              <ShieldAlert size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.78rem', color: '#FDA4AF', lineHeight: 1.45 }}>
                {errorMsg}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.15rem' }}>
              <label className="pfx-label" htmlFor="admin-email">Alamat Email</label>
              <input
                id="admin-email"
                type="email"
                className="pfx-input"
                placeholder="admin@paltifx.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: '1.65rem' }}>
              <label className="pfx-label" htmlFor="admin-password">Kata Sandi</label>
              <input
                id="admin-password"
                type="password"
                className="pfx-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.7rem', fontSize: '0.86rem' }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <span>Masuk ke Konsol</span>
              )}
            </button>
          </form>

          {/* Divider & Return to Landing Page Button */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            alignItems: 'center',
          }}>
            <button
              type="button"
              onClick={onBackToLanding}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontSize: '0.84rem',
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span>Masuk ke Landing Page</span>
            </button>

            {/* Quick test shortcut */}
            <button
              type="button"
              onClick={handleFillTestAdmin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--gold-accent)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
            >
              <span>Gunakan Akun Uji Admin (dioraput@gmail.com)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
