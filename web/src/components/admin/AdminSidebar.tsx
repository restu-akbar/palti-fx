import { 
  LayoutDashboard, 
  BookOpen, 
  KeyRound, 
  Users, 
  LogOut, 
  ExternalLink 
} from 'lucide-react';
import type { Profile } from '../../types/admin';
import { AdminAuthService } from '../../lib/adminAuth';

export interface AdminSidebarProps {
  currentAdmin: Profile;
  activeTab: 'dashboard' | 'materi' | 'invitations' | 'users';
  onSelectTab: (tab: 'dashboard' | 'materi' | 'invitations' | 'users') => void;
  onLogout: () => void;
  onViewLanding: () => void;
}

/**
 * AdminSidebar — Modul Navigasi Utama Admin PALTI FX
 * Memiliki ukuran tetap (fixed 240px x 100vh) dan terkunci di posisi kiri viewport.
 * Tidak terpengaruh scroll halaman utama.
 */
export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentAdmin,
  activeTab,
  onSelectTab,
  onLogout,
  onViewLanding,
}) => {
  const handleLogout = async () => {
    await AdminAuthService.logout();
    onLogout();
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'materi' as const, label: 'Kurikulum & Bab', icon: BookOpen },
    { id: 'invitations' as const, label: 'Kode Undangan VIP', icon: KeyRound },
    { id: 'users' as const, label: 'Member & Akses', icon: Users },
  ];

  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
      backgroundColor: 'rgba(11, 15, 22, 0.75)',
      backdropFilter: 'blur(28px) saturate(140%)',
      WebkitBackdropFilter: 'blur(28px) saturate(140%)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ─── Watermark: Logo Lingkaran PALTI FX di Scale-Up Sangat Besar & Digeser ke Kanan ─── */}
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
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Brand Header */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '1.35rem 1.25rem 1.15rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <img
          src="/palti-logo.png"
          alt="PALTI FX Logo"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            objectFit: 'cover',
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em' }}>PALTI FX</span>
            <span className="pfx-badge pfx-badge-gold" style={{ fontSize: '0.6rem', padding: '0.08rem 0.35rem' }}>
              ADMIN
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1px' }}>
            Management Console
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '1.25rem 0.75rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        overflowY: 'auto',
      }}>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '0.4rem 0.65rem 0.5rem',
        }}>
          Menu Utama
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                padding: '0.6rem 0.85rem',
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
              <Icon size={16} color={isActive ? 'var(--gold-accent)' : 'var(--text-dim)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer: Admin Profile */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '1.15rem 1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--gold-accent)',
            flexShrink: 0,
          }}>
            {(currentAdmin.full_name || currentAdmin.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentAdmin.full_name || 'Admin'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentAdmin.email}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
          <button
            onClick={onViewLanding}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'center' }}
            title="Kunjungi Website Publik"
          >
            <ExternalLink size={12} />
            <span>Web</span>
          </button>
          <button
            onClick={handleLogout}
            className="btn-danger-ghost"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'center' }}
            title="Keluar dari akun admin"
          >
            <LogOut size={12} />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
