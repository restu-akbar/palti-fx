import { LandingPage } from './pages/LandingPage';

export function App() {
  const handleNavigateAdmin = () => {
    const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173/admin';
    if (adminUrl.startsWith('http')) {
      window.open(adminUrl, '_blank');
    } else {
      window.location.href = adminUrl;
    }
  };

  return <LandingPage onNavigateAdmin={handleNavigateAdmin} />;
}

export default App;
