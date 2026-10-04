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

