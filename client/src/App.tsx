import { useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { PasswordReset } from './pages/PasswordReset';
import { Login } from './pages/Login';
import { apiClient } from './services/api';
import './styles/globals.css';
export const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const checkSession = async () => {
    setLoading(true); setError('');
    if (!localStorage.getItem('questline_jwt_token')) { setLoading(false); return; }
    try { await apiClient.get('/auth/me'); setAuthenticated(true); }
    catch { setError('Không thể xác nhận phiên đăng nhập. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    void checkSession();
    const expire = () => { setAuthenticated(false); setError(''); };
    window.addEventListener('questline-session-expired', expire);
    return () => window.removeEventListener('questline-session-expired', expire);
  }, []);
  if (['/forgot-password', '/reset-password'].includes(window.location.pathname)) return <PasswordReset />;
  if (loading) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (error && localStorage.getItem('questline_jwt_token')) return <div role="alert">{error}<button onClick={checkSession}>Thử lại</button></div>;
  return authenticated ? <Dashboard /> : <Login onLogin={() => { window.history.replaceState({}, '', '/'); setAuthenticated(true); }} />;
};
export default App;
