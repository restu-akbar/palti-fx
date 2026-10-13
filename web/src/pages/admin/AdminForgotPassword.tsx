import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RotateCw,
  Check
} from 'lucide-react';
import { AdminAuthService, checkAdminPasswordCriteria } from '../../lib/adminAuth';

interface AdminForgotPasswordProps {
  onBackToLogin: () => void;
  initialEmail?: string;
}

export const AdminForgotPassword: React.FC<AdminForgotPasswordProps> = ({
  onBackToLogin,
  initialEmail = '',
}) => {
  // Step: 1 = Minta OTP ke Email, 2 = Masukkan OTP & Kata Sandi Baru, 3 = Sukses Selesai
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Countdown timer untuk kirim ulang OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Langkah 1: Kirim Kode OTP ke Email
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Silakan masukkan alamat email administrator.');
      return;
    }

    setLoading(true);
    try {
      const res = await AdminAuthService.requestPasswordReset(cleanEmail);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal mengirim kode pemulihan.');
      } else {
        setInfoMsg(`Kode verifikasi OTP telah dikirim ke ${cleanEmail}. Periksa folder Kotak Masuk atau Spam.`);
        setStep(2);
        setCountdown(60);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // Kirim Ulang OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resending || loading) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setResending(true);

    try {
      const res = await AdminAuthService.requestPasswordReset(email.trim().toLowerCase());
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal mengirim ulang kode OTP.');
      } else {
        setInfoMsg('Kode OTP baru telah berhasil dikirim ke email Anda. Gunakan kode dari email PALING TERBARU.');
        setCountdown(60);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengirim ulang kode.');
    } finally {
      setResending(false);
    }
  };

  // Langkah 2: Verifikasi OTP & Atur Sandi Baru
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg('Silakan masukkan kode OTP verifikasi yang valid (6-8 digit).');
      return;
    }

    const pwCriteria = checkAdminPasswordCriteria(newPassword);
    if (!pwCriteria.minLength) {
      setErrorMsg('Kata sandi baru minimal harus terdiri dari 8 karakter.');
      return;
    }
    if (!pwCriteria.hasLetter) {
      setErrorMsg('Kata sandi baru harus mengandung setidaknya satu huruf (a-z / A-Z).');
      return;
    }
    if (!pwCriteria.hasDigit) {
      setErrorMsg('Kata sandi baru harus mengandung setidaknya satu angka (0-9).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verifikasi OTP
      const verifyRes = await AdminAuthService.verifyResetOtp(email.trim().toLowerCase(), cleanOtp);
      if (!verifyRes.success) {
        setErrorMsg(verifyRes.error || 'Verifikasi kode OTP gagal.');
        setLoading(false);
        return;
      }

      // 2. Simpan Kata Sandi Baru
      const updateRes = await AdminAuthService.updateForgottenPassword(newPassword);
      if (!updateRes.success) {
        setErrorMsg(updateRes.error || 'Gagal memperbarui kata sandi baru.');
        setLoading(false);
        return;
      }

      // 3. Sukses
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat menyimpan kata sandi.');
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
      {/* ─── Colossal Background Logo ─── */}
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

      {/* ─── Landscape Glassmorphic Card ─── */}
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
        {/* ─── Left Side: Brand Narrative & Identity ─── */}
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
              Pemulihan Akses Kata Sandi
            </h1>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
            }}>
              Prosedur verifikasi terenkripsi dua langkah via Supabase Auth untuk mereset kata sandi akun administrator secara aman dan mandiri.
            </p>

            {/* Stepper Progress Indicator */}
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  backgroundColor: step >= 1 ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.1)',
                  color: step >= 1 ? '#07090D' : 'var(--text-dim)',
                  boxShadow: step >= 1 ? '0 0 12px rgba(207, 168, 94, 0.35)' : 'none',
                }}>
                  1
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: step === 1 ? 600 : 500, color: step === 1 ? '#FFF' : 'var(--text-dim)' }}>
                    Permintaan Kode OTP
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  backgroundColor: step >= 2 ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.1)',
                  color: step >= 2 ? '#07090D' : 'var(--text-dim)',
                  boxShadow: step >= 2 ? '0 0 12px rgba(207, 168, 94, 0.35)' : 'none',
                }}>
                  2
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: step === 2 ? 600 : 500, color: step === 2 ? '#FFF' : 'var(--text-dim)' }}>
                    Verifikasi &amp; Sandi Baru
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  backgroundColor: step === 3 ? 'var(--success)' : 'rgba(255, 255, 255, 0.1)',
                  color: step === 3 ? '#07090D' : 'var(--text-dim)',
                  boxShadow: step === 3 ? '0 0 12px rgba(52, 211, 153, 0.35)' : 'none',
                }}>
                  ✓
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: step === 3 ? 600 : 500, color: step === 3 ? '#FFF' : 'var(--text-dim)' }}>
                    Selesai &amp; Siap Masuk
                  </span>
                </div>
              </div>
            </div>
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
            <span>Autentikasi Aman Supabase Auth</span>
          </div>
        </div>

        {/* ─── Right Side: Forms & Actions ─── */}
        <div style={{
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.12)',
        }}>
          {/* Header Title based on Step */}
          {step === 1 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', marginBottom: '0.35rem' }}>
                Lupa Kata Sandi?
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Masukkan email akun administrator untuk menerima kode pemulihan.
              </p>
            </div>
          )}

          {step === 2 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', marginBottom: '0.35rem' }}>
                Atur Kata Sandi Baru
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Kode telah dikirim ke <strong style={{ color: '#FFF' }}>{email}</strong>. Periksa folder Kotak Masuk atau Spam.
              </p>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 0 25px rgba(52, 211, 153, 0.25)',
              }}>
                <CheckCircle2 size={32} color="var(--success)" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: '#FFF', marginBottom: '0.5rem' }}>
                Kata Sandi Berhasil Diperbarui!
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '340px', margin: '0 auto' }}>
                Kredensial akun administrator Anda telah diperbarui. Silakan masuk kembali menggunakan kata sandi yang baru.
              </p>
            </div>
          )}

          {/* Error Message Box */}
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

          {/* Info / Success Message Box */}
          {infoMsg && step !== 3 && (
            <div style={{
              backgroundColor: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.8rem 1rem',
              marginBottom: '1.25rem',
            }}>
              <span style={{ fontSize: '0.78rem', color: '#6EE7B7', lineHeight: 1.45 }}>
                {infoMsg}
              </span>
            </div>
          )}

          {/* ─── FORM STEP 1: Masukkan Email ─── */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp}>
              <div style={{ marginBottom: '1.45rem' }}>
                <label className="pfx-label" htmlFor="reset-email">Alamat Email Administrator</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-email"
                    type="email"
                    className="pfx-input"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                    style={{ paddingLeft: '2.4rem' }}
                  />
                  <Mail
                    size={16}
                    color="var(--text-dim)"
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
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
                    <span>Mengirim Kode OTP...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={15} />
                    <span>Kirim Kode Verifikasi</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ─── FORM STEP 2: Masukkan OTP & Sandi Baru ─── */}
          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              {/* Input OTP */}
              <div style={{ marginBottom: '1.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label className="pfx-label" htmlFor="reset-otp" style={{ margin: 0 }}>Kode OTP</label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || resending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: countdown > 0 ? 'var(--text-dim)' : 'var(--gold-accent)',
                      fontSize: '0.74rem',
                      cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <RotateCw size={12} className={resending ? 'animate-spin' : ''} />
                    <span>{countdown > 0 ? `Kirim Ulang Kode (${countdown}s)` : 'Kirim Ulang Kode'}</span>
                  </button>
                </div>
                <input
                  id="reset-otp"
                  type="text"
                  maxLength={8}
                  className="pfx-input"
                  placeholder="Contoh: 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  style={{
                    letterSpacing: '0.25em',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                />
              </div>

              {/* Input Sandi Baru */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label className="pfx-label" htmlFor="reset-new-password">Kata Sandi Baru</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-new-password"
                    name="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    className="pfx-input"
                    placeholder="Minimal 8 karakter (huruf & angka)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                  />
                  <Lock
                    size={15}
                    color="var(--text-dim)"
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
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
                    }}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Input Konfirmasi Sandi Baru */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="pfx-label" htmlFor="reset-confirm-password">Konfirmasi Kata Sandi Baru</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="pfx-input"
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                  />
                  <Lock
                    size={15}
                    color="var(--text-dim)"
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Indikator Kriteria Kata Sandi */}
              <div style={{
                marginBottom: '1.45rem',
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                fontSize: '0.73rem',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: newPassword.length >= 8 ? 'var(--success)' : 'var(--text-dim)',
                  transition: 'color 0.15s ease',
                }}>
                  <Check size={12} style={{ opacity: newPassword.length >= 8 ? 1 : 0.3 }} />
                  <span>Minimal 8 karakter</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: /[a-zA-Z]/.test(newPassword) ? 'var(--success)' : 'var(--text-dim)',
                  transition: 'color 0.15s ease',
                }}>
                  <Check size={12} style={{ opacity: /[a-zA-Z]/.test(newPassword) ? 1 : 0.3 }} />
                  <span>Mengandung huruf (A-Z / a-z)</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: /[0-9]/.test(newPassword) ? 'var(--success)' : 'var(--text-dim)',
                  transition: 'color 0.15s ease',
                }}>
                  <Check size={12} style={{ opacity: /[0-9]/.test(newPassword) ? 1 : 0.3 }} />
                  <span>Mengandung angka (0-9)</span>
                </div>
                {confirmPassword.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    color: newPassword === confirmPassword ? 'var(--success)' : '#FDA4AF',
                    transition: 'color 0.15s ease',
                  }}>
                    <Check size={12} style={{ opacity: newPassword === confirmPassword ? 1 : 0.4 }} />
                    <span>{newPassword === confirmPassword ? 'Konfirmasi kata sandi cocok' : 'Konfirmasi kata sandi belum cocok'}</span>
                  </div>
                )}
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
                    <span>Memperbarui Sandi...</span>
                  </>
                ) : (
                  <span>Perbarui Kata Sandi</span>
                )}
              </button>
            </form>
          )}

          {/* ─── STEP 3: Sukses Selesai ─── */}
          {step === 3 && (
            <div>
              <button
                type="button"
                onClick={onBackToLogin}
                className="btn-primary"
                style={{ width: '100%', padding: '0.7rem', fontSize: '0.86rem' }}
              >
                <span>Masuk Sekarang</span>
              </button>
            </div>
          )}

          {/* Bottom Divider & Kembali ke Login */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            alignItems: 'center',
          }}>
            {step === 2 && (
              <button
                type="button"
                onClick={() => { setStep(1); setErrorMsg(null); setInfoMsg(null); }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  fontSize: '0.84rem',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <Mail size={14} />
                <span>Ubah Email</span>
              </button>
            )}

            {step !== 3 && (
              <button
                type="button"
                onClick={onBackToLogin}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  fontSize: '0.84rem',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <ArrowLeft size={14} />
                <span>Kembali ke Halaman Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
