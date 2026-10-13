import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  KeyRound,
  Users,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import type { Profile } from '../../types/admin';
import { AdminAuthService, checkAdminPasswordCriteria } from '../../lib/adminAuth';

export interface AdminSidebarProps {
  currentAdmin: Profile;
  activeTab: 'dashboard' | 'materi' | 'invitations' | 'users';
  onSelectTab: (tab: 'dashboard' | 'materi' | 'invitations' | 'users') => void;
  onLogout: () => void;
  onUpdateAdminProfile?: (profile: Profile) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * AdminSidebar — Modul Navigasi Utama Admin PALTI FX
 * Memiliki ukuran tetap (240px x 100vh atau 68px saat minimize) dan terkunci di posisi kiri viewport.
 * Tidak terpengaruh scroll halaman utama.
 */
export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentAdmin,
  activeTab,
  onSelectTab,
  onLogout,
  onUpdateAdminProfile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  // ─── Modal States ───
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(currentAdmin.full_name || '');
  const [editEmail, setEditEmail] = useState(currentAdmin.email || '');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const handleOpenProfileModal = () => {
    setEditName(currentAdmin.full_name || '');
    setEditEmail(currentAdmin.email || '');
    setEditPassword('');
    setEditConfirmPassword('');
    setShowEditPassword(false);
    setShowEditConfirmPassword(false);
    setProfileError(null);
    setProfileSuccess(null);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!editName.trim()) {
      setProfileError('Nama lengkap administrator tidak boleh kosong.');
      return;
    }
    if (!editEmail.trim()) {
      setProfileError('Alamat email administrator tidak boleh kosong.');
      return;
    }
    if (editPassword) {
      const pwCriteria = checkAdminPasswordCriteria(editPassword);
      if (!pwCriteria.minLength) {
        setProfileError('Kata sandi baru minimal terdiri dari 8 karakter.');
        return;
      }
      if (!pwCriteria.hasLetter) {
        setProfileError('Kata sandi baru harus mengandung setidaknya satu huruf (a-z / A-Z).');
        return;
      }
      if (!pwCriteria.hasDigit) {
        setProfileError('Kata sandi baru harus mengandung setidaknya satu angka (0-9).');
        return;
      }
      if (editPassword !== editConfirmPassword) {
        setProfileError('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    setProfileSaving(true);
    try {
      const res = await AdminAuthService.updateAdminProfile(currentAdmin.id, {
        fullName: editName,
        email: editEmail,
        password: editPassword || undefined,
      });

      if (!res.success) {
        setProfileError(res.error || 'Gagal memperbarui profil admin.');
      } else {
        setProfileSuccess(res.message || 'Profil berhasil diperbarui langsung ke Supabase.');
        if (res.updatedProfile && onUpdateAdminProfile) {
          onUpdateAdminProfile(res.updatedProfile);
        }
        setEditPassword('');
        setEditConfirmPassword('');
        setTimeout(() => {
          setShowProfileModal(false);
          setProfileSuccess(null);
        }, 1200);
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Terjadi kesalahan sistem saat memperbarui profil.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await AdminAuthService.logout();
      setShowLogoutModal(false);
      onLogout();
    } catch (err) {
      console.error(err);
      onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'materi' as const, label: 'Kurikulum & Bab', icon: BookOpen },
    { id: 'invitations' as const, label: 'Kode Undangan VIP', icon: KeyRound },
    { id: 'users' as const, label: 'Member & Akses', icon: Users },
  ];

  return (
    <>
      <aside style={{
        width: isCollapsed ? '68px' : '240px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        backgroundColor: 'rgba(11, 15, 22, 0.62)',
        backdropFilter: 'blur(30px) saturate(160%)',
        WebkitBackdropFilter: 'blur(30px) saturate(160%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* ─── Watermark: Logo Lingkaran PALTI FX (Clipped di dalam sidebar) ─── */}
        {!isCollapsed && (
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '78%',
              transform: 'translate(-50%, -50%)',
              width: '620px',
              height: '620px',
              backgroundImage: 'url(/palti-logo.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              opacity: 0.075,
            }} />
          </div>
        )}

        {/* ─── Toggle Handle Menonjol di Tengah Perbatasan Sidebar (Edge Grip Handle) ─── */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Perluas / Buka Sidebar' : 'Perkecil / Tutup Sidebar'}
            aria-label={isCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
            style={{
              position: 'absolute',
              top: '50%',
              right: '-12px',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 20, 31, 0.96)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-accent)',
              cursor: 'pointer',
              zIndex: 70,
              padding: 0,
              transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.18s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.18)';
              e.currentTarget.style.borderColor = 'var(--gold-accent)';
              e.currentTarget.style.color = '#FFF';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(207, 168, 94, 0.5), 0 4px 16px rgba(0, 0, 0, 0.7)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.color = 'var(--gold-accent)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)';
            }}
          >
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        )}

        {/* Brand Header */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: isCollapsed ? '1.35rem 0.5rem 1.15rem' : '1.35rem 1.25rem 1.15rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: '0.75rem',
          transition: 'padding 0.28s ease',
        }}>
          <img
            src="/palti-logo.png"
            alt="PALTI FX Logo"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Klik untuk memperluas sidebar' : 'PALTI FX Admin'}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              objectFit: 'cover',
              cursor: isCollapsed ? 'pointer' : 'default',
              flexShrink: 0,
            }}
          />
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>PALTI FX</span>
                <span className="pfx-badge pfx-badge-gold" style={{ fontSize: '0.6rem', padding: '0.08rem 0.35rem' }}>
                  ADMIN
                </span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1px', whiteSpace: 'nowrap' }}>
                Management Console
              </p>
            </div>
          )}
        </div>

        {/* Navigation Items (Text 'Menu Utama' Dihapus Sesuai Permintaan) */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: isCollapsed ? '1.25rem 0.5rem' : '1.25rem 0.75rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          overflowY: 'auto',
          transition: 'padding 0.28s ease',
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? 0 : '0.7rem',
                  padding: isCollapsed ? '0.65rem 0' : '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
                  background: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  backdropFilter: isActive ? 'blur(12px)' : 'none',
                  boxShadow: isActive ? 'inset 0 1px 0 rgba(255, 255, 255, 0.15)' : 'none',
                  color: isActive ? '#FFF' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={17} color={isActive ? 'var(--gold-accent)' : 'var(--text-dim)'} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Admin Profile & Log Out */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: isCollapsed ? '1rem 0.5rem' : '1.15rem 1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCollapsed ? 'center' : 'stretch',
          gap: isCollapsed ? '0.5rem' : '0',
          transition: 'padding 0.28s ease',
        }}>
          {/* Clickable Profile Card (Buka Modul Ubah Profil) */}
          <div
            onClick={handleOpenProfileModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              padding: isCollapsed ? '0.45rem' : '0.45rem 0.55rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              marginBottom: isCollapsed ? 0 : '0.75rem',
              transition: 'background 0.15s ease',
              border: '1px solid transparent',
              width: isCollapsed ? 'auto' : '100%',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            title={isCollapsed ? `Profil Admin (${currentAdmin.full_name || 'Admin'})` : 'Klik untuk mengubah nama, email, dan password admin'}
          >
            {isCollapsed ? (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--gold-accent)',
              }}>
                {(currentAdmin.full_name || 'A').charAt(0).toUpperCase()}
              </div>
            ) : (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#FFF' }}>
                  {currentAdmin.full_name || 'Admin'}
                </div>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '2px' }}>
                  {currentAdmin.email}
                </div>
              </div>
            )}
          </div>

          {/* Log Out Button */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="btn-danger-ghost"
            style={{
              width: isCollapsed ? '34px' : '100%',
              height: isCollapsed ? '34px' : 'auto',
              fontSize: '0.78rem',
              padding: isCollapsed ? 0 : '0.5rem 0.75rem',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: isCollapsed ? 0 : '0.5rem',
            }}
            title="Log Out (Keluar dari akun admin)"
          >
            <LogOut size={13} />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── Modal Transparent Blur: Konfirmasi Log Out ─── */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          backgroundColor: 'rgba(4, 7, 14, 0.65)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}>
          <div style={{
            maxWidth: '430px',
            width: '100%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(11, 15, 26, 0.6)',
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 32px 85px rgba(0, 0, 0, 0.72), inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 0 25px rgba(255, 255, 255, 0.02)',
            padding: '2.25rem 2rem',
            textAlign: 'center',
            position: 'relative',
          }}>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', marginBottom: '0.65rem' }}>
              Konfirmasi Log Out
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
              Apakah Anda yakin ingin keluar dari Konsol Manajemen Admin PALTI FX? Anda akan diarahkan kembali ke halaman login admin.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="btn-cancel"
                disabled={loggingOut}
                style={{ padding: '0.65rem 1rem', fontSize: '0.84rem', justifyContent: 'center' }}
              >
                <span>Batal</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={loggingOut}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 1rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#DC2626')}
              >
                {loggingOut ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Ya, Log Out</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Transparent Blur: Modul Ubah Profil Admin (Nama, Email, Password) ─── */}
      {showProfileModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !profileSaving) {
              setShowProfileModal(false);
            }
          }}
          style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          backgroundColor: 'rgba(4, 7, 14, 0.65)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(11, 15, 26, 0.6)',
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 32px 85px rgba(0, 0, 0, 0.72), inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 0 25px rgba(255, 255, 255, 0.02)',
            padding: '2.25rem 2rem',
            position: 'relative',
          }}>
            {/* Header (Clean, Icon & Tombol X Dihapus Sesuai Permintaan) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFF', letterSpacing: '-0.02em' }}>
                Profil Administrator
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px', lineHeight: 1.5 }}>
                Kelola nama, email, dan kredensial akses backoffice (Supabase).
              </p>
            </div>

            {/* Feedback Messages */}
            {profileError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: '#FDA4AF',
                fontSize: '0.78rem',
                marginBottom: '1.25rem',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#6EE7B7',
                fontSize: '0.78rem',
                marginBottom: '1.25rem',
              }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="pfx-label" htmlFor="edit-admin-name">Nama Lengkap Admin</label>
                <input
                  id="edit-admin-name"
                  type="text"
                  className="pfx-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="masukan nama baru disini"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="pfx-label" htmlFor="edit-admin-email">Alamat Email Admin</label>
                <input
                  id="edit-admin-email"
                  type="email"
                  className="pfx-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="masukan email baru disini"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="pfx-label" htmlFor="edit-admin-password">
                  Kata Sandi Baru <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(Opsional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="edit-admin-password"
                    name="new-password"
                    type={showEditPassword ? 'text' : 'password'}
                    className="pfx-input"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Minimal 8 karakter (huruf & angka)"
                    autoComplete="new-password"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
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
                    aria-label={showEditPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showEditPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {editPassword && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="pfx-label" htmlFor="edit-admin-confirm-password">Konfirmasi Kata Sandi Baru</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="edit-admin-confirm-password"
                      name="confirm-password"
                      type={showEditConfirmPassword ? 'text' : 'password'}
                      className="pfx-input"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
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
                      aria-label={showEditConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showEditConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {editPassword && (
                <div style={{
                  marginBottom: '1.25rem',
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
                    color: editPassword.length >= 8 ? 'var(--success)' : 'var(--text-dim)',
                    transition: 'color 0.15s ease',
                  }}>
                    <Check size={12} style={{ opacity: editPassword.length >= 8 ? 1 : 0.3 }} />
                    <span>Minimal 8 karakter</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    color: /[a-zA-Z]/.test(editPassword) ? 'var(--success)' : 'var(--text-dim)',
                    transition: 'color 0.15s ease',
                  }}>
                    <Check size={12} style={{ opacity: /[a-zA-Z]/.test(editPassword) ? 1 : 0.3 }} />
                    <span>Mengandung huruf (A-Z / a-z)</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    color: /[0-9]/.test(editPassword) ? 'var(--success)' : 'var(--text-dim)',
                    transition: 'color 0.15s ease',
                  }}>
                    <Check size={12} style={{ opacity: /[0-9]/.test(editPassword) ? 1 : 0.3 }} />
                    <span>Mengandung angka (0-9)</span>
                  </div>
                  {editConfirmPassword.length > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      color: editPassword === editConfirmPassword ? 'var(--success)' : '#FDA4AF',
                      transition: 'color 0.15s ease',
                    }}>
                      <Check size={12} style={{ opacity: editPassword === editConfirmPassword ? 1 : 0.4 }} />
                      <span>{editPassword === editConfirmPassword ? 'Konfirmasi kata sandi cocok' : 'Konfirmasi kata sandi belum cocok'}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="btn-cancel"
                  disabled={profileSaving}
                  style={{ padding: '0.6rem 1rem', fontSize: '0.82rem' }}
                >
                  <span>Batal</span>
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={profileSaving}
                  style={{ padding: '0.6rem 1.15rem', fontSize: '0.82rem' }}
                >
                  {profileSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

