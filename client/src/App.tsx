import { useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { PasswordReset } from './pages/PasswordReset';
import { AuthPage } from './pages/AuthPage';
import { authService } from './services/auth.service';
import type { UserProfile } from './types/auth.types';
import { Login } from './pages/Login';
import { apiClient } from './services/api';
import { GamificationProvider } from './context/GamificationContext';
import './styles/globals.css';
export const App = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const checkSession = async () => {
    setLoading(true); setError('');
    if (!localStorage.getItem('questline_jwt_token')) { setLoading(false); return; }
    try {
      const { data } = await apiClient.get<{ data: UserProfile }>('/auth/me');
      setUser(data.data);
    }
    catch { setError('Không thể xác nhận phiên đăng nhập. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    void checkSession();
    const expire = () => {
      authService.logout();
      setUser(null);
      setError('');
    };
    window.addEventListener('questline-session-expired', expire);
    return () => window.removeEventListener('questline-session-expired', expire);
  }, []);
  if (['/forgot-password', '/reset-password'].includes(window.location.pathname)) return <PasswordReset />;
  if (loading) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (error && localStorage.getItem('questline_jwt_token')) return <div role="alert">{error}<button onClick={checkSession}>Thử lại</button></div>;
  const startSession = (profile: UserProfile) => {
    window.history.replaceState({}, '', '/');
    setRegistering(false);
    setUser(profile);
  };

  if (user) {
    return (
      <GamificationProvider currentUser={user} onUpdateUser={(updated) => setUser(updated)}>
        <Dashboard
          currentUser={user}
          onUpdateUser={(updated) => setUser(updated)}
          onLogout={() => {
            authService.logout();
            setUser(null);
          }}
        />
      </GamificationProvider>
    );
  }
  if (registering) {
    return <AuthPage onAuthSuccess={({ user }) => startSession(user)} onSwitchToLogin={() => setRegistering(false)} />;
  }
  return <Login onLogin={startSession} onSwitchToRegister={() => setRegistering(true)} />;
};
export default App;
