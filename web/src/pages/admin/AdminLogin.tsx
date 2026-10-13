import { useState } from 'react';
import { ShieldAlert, Loader2, Eye, EyeOff } from 'lucide-react';
import { AdminAuthService } from '../../lib/adminAuth';
import type { Profile } from '../../types/admin';

interface AdminLoginProps {
  onLoginSuccess: (profile: Profile) => void;
  onForgotPassword: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      {/* ─── Colossal Background Logo (Nyaru dengan Background, Tanpa Efek Backlight) ─── */}
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
        opacity: 0.14,
        maskImage: 'radial-gradient(circle at center, black 48%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 48%, transparent 70%)',
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
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
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

          <form onSubmit={handleSubmit} method="post" action="#" name="admin-login-form">
            <div style={{ marginBottom: '1.15rem' }}>
              <label className="pfx-label" htmlFor="admin-email">Alamat Email</label>
              <input
                id="admin-email"
                name="username"
                type="email"
                className="pfx-input"
                placeholder="input email disini"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div style={{ marginBottom: '1.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label className="pfx-label" htmlFor="admin-password" style={{ margin: 0 }}>Kata Sandi</label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--gold-accent)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'color 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = 'var(--gold-hover)')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--gold-accent)')}
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="pfx-input"
                  placeholder="input password disini"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.25rem',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#FFF')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
        </div>
      </div>
    </div>
  );
};

