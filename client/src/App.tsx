import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { AuthPage } from './pages/AuthPage';
import { authService } from './services/auth.service';
import type { UserProfile } from './types/auth.types';
import './styles/globals.css';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getStoredUser());
  const [showAuth, setShowAuth] = useState<boolean>(() => !authService.getStoredUser());

  const handleAuthSuccess = (data: { user: UserProfile }) => {
    setUser(data.user);
    setShowAuth(false);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setShowAuth(true);
  };

  if (showAuth) {
    return (
      <>
        <AuthPage
          initialMode="register"
          onAuthSuccess={handleAuthSuccess}
        />
        <div style={{ position: 'fixed', bottom: 12, left: 12, zIndex: 9999 }}>
          <button
            type="button"
            className="small"
            style={{ opacity: 0.75, background: '#fff', border: '1px solid #ccc' }}
            onClick={() => setShowAuth(false)}
          >
            Chuyển sang Dashboard (Bỏ qua đăng nhập) ↗
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Dashboard currentUser={user} onLogout={handleLogout} />
      <div style={{ position: 'fixed', bottom: 12, left: 12, zIndex: 9999 }}>
        <button
          type="button"
          className="small"
          style={{ opacity: 0.75, background: '#fff', border: '1px solid #ccc' }}
          onClick={() => setShowAuth(true)}
        >
          Trang Đăng ký / Xác thực ↗
        </button>
      </div>
    </>
  );
};

export default App;
