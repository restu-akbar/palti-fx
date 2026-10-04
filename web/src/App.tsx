import { useEffect, useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardView } from './pages/admin/AdminDashboardView';
import { AdminMateriView } from './pages/admin/AdminMateriView';
import { AdminInvitationsView } from './pages/admin/AdminInvitationsView';
import { AdminUsersView } from './pages/admin/AdminUsersView';
import { AdminAuthService } from './lib/adminAuth';
import type { Profile } from './types/admin';

type AdminTab = 'dashboard' | 'materi' | 'invitations' | 'users';

export function App() {
  const [currentAdmin, setCurrentAdmin] = useState<Profile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Route state: 'landing' | 'admin-login' | 'admin-panel'
  const [currentView, setCurrentView] = useState<'landing' | 'admin-login' | 'admin-panel'>('landing');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');

  // Parse path on initial load & popstate
  const syncRouteFromUrl = () => {
    const path = window.location.pathname.toLowerCase();

    if (path.startsWith('/admin')) {
      if (path.includes('/materi')) setActiveAdminTab('materi');
      else if (path.includes('/invitations') || path.includes('/invite')) setActiveAdminTab('invitations');
      else if (path.includes('/users') || path.includes('/member')) setActiveAdminTab('users');
      else setActiveAdminTab('dashboard');

      // If already logged in, show admin-panel; otherwise show admin-login
      if (currentAdmin) {
        setCurrentView('admin-panel');
      } else {
        setCurrentView('admin-login');
      }
    } else {
      setCurrentView('landing');
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
          const path = window.location.pathname.toLowerCase();
          if (path.startsWith('/admin')) {
            setCurrentView('admin-panel');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingAuth(false);
        syncRouteFromUrl();
      }
    };

    initAuth();

    window.addEventListener('popstate', syncRouteFromUrl);
    return () => window.removeEventListener('popstate', syncRouteFromUrl);
  }, []);

  const navigateTo = (view: 'landing' | 'admin-login' | 'admin-panel', tab?: AdminTab) => {
    if (tab) setActiveAdminTab(tab);
    setCurrentView(view);

    let path = '/';
    if (view === 'admin-login') {
      path = '/admin/login';
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
    navigateTo('admin-panel', 'dashboard');
  };

  const handleLogout = () => {
    setCurrentAdmin(null);
    navigateTo('landing');
  };

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--gold-500)',
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            border: '3px solid var(--gold-500)',
            borderTopColor: 'transparent',
            margin: '0 auto 1.5rem',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span>Memuat Ekosistem PALTI FX...</span>
        </div>
      </div>
    );
  }

  // 1. Landing Page
  if (currentView === 'landing') {
    return <LandingPage onNavigateAdmin={() => navigateTo(currentAdmin ? 'admin-panel' : 'admin-login')} />;
  }

  // 2. Admin Login
  if (currentView === 'admin-login') {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => navigateTo('landing')}
      />
    );
  }

  // 3. Admin Backoffice Panel (Guarded)
  if (currentView === 'admin-panel' && currentAdmin) {
    return (
      <AdminLayout
        currentAdmin={currentAdmin}
        activeTab={activeAdminTab}
        onSelectTab={(tab) => navigateTo('admin-panel', tab)}
        onLogout={handleLogout}
        onViewLanding={() => navigateTo('landing')}
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

  // Fallback to landing
  return <LandingPage onNavigateAdmin={() => navigateTo('admin-login')} />;
}

export default App;
