import { useState } from 'react';
import type { Profile } from '../../types/admin';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

interface AdminLayoutProps {
  currentAdmin: Profile;
  activeTab: 'dashboard' | 'materi' | 'invitations' | 'users';
  onSelectTab: (tab: 'dashboard' | 'materi' | 'invitations' | 'users') => void;
  onLogout: () => void;
  onViewLanding?: () => void;
  onUpdateAdminProfile?: (profile: Profile) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentAdmin,
  activeTab,
  onSelectTab,
  onLogout,
  onViewLanding,
  onUpdateAdminProfile,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('palti_admin_sidebar_collapsed') === 'true';
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('palti_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-deep)' }}>
      {/* ─── Standalone Fixed Admin Sidebar (Locked in place on scroll) ─── */}
      <AdminSidebar
        currentAdmin={currentAdmin}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onLogout={onLogout}
        onViewLanding={onViewLanding}
        onUpdateAdminProfile={onUpdateAdminProfile}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* ─── Main Content Area (Offset by 240px or 68px saat minimize, bergeser mulus ke kiri) ─── */}
      <div style={{
        marginLeft: isSidebarCollapsed ? '68px' : '240px',
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
        transition: 'margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        backgroundColor: '#07090D',
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

