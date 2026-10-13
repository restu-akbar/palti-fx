import { useEffect, useState } from 'react';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminForgotPassword } from './pages/admin/AdminForgotPassword';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardView } from './pages/admin/AdminDashboardView';
import { AdminMateriView } from './pages/admin/AdminMateriView';
import { AdminInvitationsView } from './pages/admin/AdminInvitationsView';
import { AdminUsersView } from './pages/admin/AdminUsersView';
import { AdminAuthService } from './lib/adminAuth';
import type { Profile } from './types/admin';

type AdminTab = 'dashboard' | 'materi' | 'invitations' | 'users';
type AppView = 'admin-login' | 'admin-forgot-password' | 'admin-panel';

export function App() {
  const [currentAdmin, setCurrentAdmin] = useState<Profile | null>(() => {
    try {
      const cached = localStorage.getItem('palti_admin_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Route state: 'admin-login' | 'admin-forgot-password' | 'admin-panel'
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const path = window.location.pathname.toLowerCase();
    if (
      path.includes('/forgot-password') ||
      path.includes('/reset-password') ||
      path.includes('/lupa-password')
    ) {
      return 'admin-forgot-password';
    }
    try {
      const cached = localStorage.getItem('palti_admin_profile');
      if (cached) return 'admin-panel';
    } catch {}
    return 'admin-login';
  });
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/materi')) return 'materi';
    if (path.includes('/invitations') || path.includes('/invite')) return 'invitations';
    if (path.includes('/users') || path.includes('/member')) return 'users';
    return 'dashboard';
  });

  // Parse path on initial load & popstate
  const syncRouteFromUrl = (adminParam?: Profile | null) => {
    const path = window.location.pathname.toLowerCase();

    if (
      path.includes('/forgot-password') ||
      path.includes('/reset-password') ||
      path.includes('/lupa-password')
    ) {
      setCurrentView('admin-forgot-password');
      return;
    }

    if (path.includes('/materi')) setActiveAdminTab('materi');
    else if (path.includes('/invitations') || path.includes('/invite')) setActiveAdminTab('invitations');
    else if (path.includes('/users') || path.includes('/member')) setActiveAdminTab('users');
    else setActiveAdminTab('dashboard');

    const effectiveAdmin = adminParam !== undefined ? adminParam : currentAdmin;
    if (effectiveAdmin) {
      setCurrentView('admin-panel');
    } else {
      setCurrentView('admin-login');
    }
  };

  // Check existing session
  useEffect(() => {
    const initAuth = async () => {
      setCheckingAuth(true);
      try {
        const admin = await AdminAuthService.getCurrentAdmin();
        if (admin) {
          setCurrentAdmin(admin);
          syncRouteFromUrl(admin);
        } else {
          setCurrentAdmin(null);
          syncRouteFromUrl(null);
        }
      } catch (err) {
        console.error(err);
        syncRouteFromUrl(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    initAuth();

    const handlePopState = () => {
      syncRouteFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: AppView, tab?: AdminTab) => {
    if (tab) setActiveAdminTab(tab);
    setCurrentView(view);

    let path = '/admin/login';
    if (view === 'admin-forgot-password') {
      path = '/admin/forgot-password';
    } else if (view === 'admin-panel') {
      const selectedTab = tab || activeAdminTab;
      path = selectedTab === 'dashboard' ? '/admin' : `/admin/${selectedTab}`;
    }

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  const handleLoginSuccess = (admin: Profile) => {
    setCurrentAdmin(admin);
    try {
      localStorage.setItem('palti_admin_profile', JSON.stringify(admin));
    } catch {}
    navigateTo('admin-panel', 'dashboard');
  };

  const handleLogout = async () => {
    try {
      await AdminAuthService.logout();
    } catch (err) {
      console.error(err);
    }
    setCurrentAdmin(null);
    navigateTo('admin-login');
  };

  const handleUpdateAdminProfile = (updatedProfile: Profile) => {
    setCurrentAdmin(updatedProfile);
  };

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-deep)',
        color: 'var(--gold-accent)',
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            border: '3px solid var(--gold-accent)',
            borderTopColor: 'transparent',
            margin: '0 auto 1.5rem',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span>Memuat Konsol Admin PALTI FX...</span>
        </div>
      </div>
    );
  }

  // 1. Forgot Password / Pemulihan Kata Sandi
  if (currentView === 'admin-forgot-password') {
    return (
      <AdminForgotPassword
        onBackToLogin={() => navigateTo('admin-login')}
      />
    );
  }

  // 2. Admin Backoffice Panel (Guarded)
  if (currentView === 'admin-panel' && currentAdmin) {
    return (
      <AdminLayout
        currentAdmin={currentAdmin}
        activeTab={activeAdminTab}
        onSelectTab={(tab) => navigateTo('admin-panel', tab)}
        onLogout={handleLogout}
        onUpdateAdminProfile={handleUpdateAdminProfile}
      >
        {activeAdminTab === 'dashboard' && (
          <AdminDashboardView
            currentAdmin={currentAdmin}
            onNavigateTab={(tab) => navigateTo('admin-panel', tab)}
          />
        )}
        {activeAdminTab === 'materi' && <AdminMateriView />}
        {activeAdminTab === 'invitations' && <AdminInvitationsView />}
        {activeAdminTab === 'users' && <AdminUsersView />}
      </AdminLayout>
    );
  }

  // 3. Admin Login (Default / Fallback)
  return (
    <AdminLogin
      onLoginSuccess={handleLoginSuccess}
      onForgotPassword={() => navigateTo('admin-forgot-password')}
    />
  );
}

export default App;
