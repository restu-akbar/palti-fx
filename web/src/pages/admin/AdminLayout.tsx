import type { Profile } from '../../types/admin';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

interface AdminLayoutProps {
  currentAdmin: Profile;
  activeTab: 'dashboard' | 'materi' | 'invitations' | 'users';
  onSelectTab: (tab: 'dashboard' | 'materi' | 'invitations' | 'users') => void;
  onLogout: () => void;
  onViewLanding: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentAdmin,
  activeTab,
  onSelectTab,
  onLogout,
  onViewLanding,
  children,
}) => {
  const tabTitles: Record<string, string> = {
    dashboard: 'Ringkasan',
    materi: 'Kurikulum & Bab',
    invitations: 'Kode Undangan VIP',
    users: 'Member & Akses',
  };

  const currentTabLabel = tabTitles[activeTab] || 'Portal Admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-deep)' }}>
      {/* ─── Standalone Fixed Admin Sidebar (Locked in place on scroll) ─── */}
      <AdminSidebar
        currentAdmin={currentAdmin}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onLogout={onLogout}
        onViewLanding={onViewLanding}
      />

      {/* ─── Main Content Area (Offset by 240px for fixed sidebar) ─── */}
      <div style={{
        marginLeft: '240px',
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Frosted Top Header Bar */}
        <header style={{
          height: '56px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2.5rem',
          backgroundColor: 'rgba(7, 9, 13, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>PALTI FX</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{currentTabLabel}</span>
          </div>
        </header>

        {/* Page Body */}
        <main style={{
          flex: 1,
          padding: '2.5rem',
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};
