import React from 'react';

interface SidebarProps {
  currentScreen?: string;
  onNavigate?: (screen: string) => void;
  userName?: string;
  userEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen = 'dashboard',
  onNavigate,
  userName = 'Minh Anh',
  userEmail = 'minhanh@example.com'
}) => {
  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brandmark">q</span>questline
      </div>
      <div className="eyebrow">Small steps. Real progress.</div>

      <nav className="nav" aria-label="Điều hướng chính">
        <button
          type="button"
          className={currentScreen === 'dashboard' ? 'active' : ''}
          onClick={() => onNavigate?.('dashboard')}
          aria-label="Dashboard (Nhiệm vụ & Tiến độ)"
          title="Dashboard (Nhiệm vụ & Tiến độ)"
        >
          <span className="idx">01</span>
          <span>
            Dashboard
            <small>Nhiệm vụ &amp; Tiến độ</small>
          </span>
        </button>

        <button
          type="button"
          className={currentScreen === 'habits' ? 'active' : ''}
          onClick={() => onNavigate?.('habits')}
          aria-label="Habit & Streak Management"
          title="Habit & Streak Management"
        >
          <span className="idx">02</span>
          <span>
            Habit &amp; Streak Management
            <small>Quản lý thói quen &amp; Chuỗi</small>
          </span>
        </button>

        <button
          type="button"
          className={currentScreen === 'profile' ? 'active' : ''}
          onClick={() => onNavigate?.('profile')}
          aria-label="Profile & Achievements"
          title="Profile & Achievements"
        >
          <span className="idx">03</span>
          <span>
            Profile &amp; Achievements
            <small>Hồ sơ &amp; Thành tích</small>
          </span>
        </button>
      </nav>

      {/* Thông tin tài khoản phía chân sidebar */}
      <div className="side-note" id="account-slot">
        <div className="account-card">
          <div
            className="account-avatar"
            aria-label={`Ảnh đại diện ${userName}`}
          >
            {getInitials(userName)}
          </div>
          <div className="account-info">
            <b>{userName}</b>
            <small>{userEmail}</small>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('questline_jwt_token');
            window.history.replaceState({}, '', '/login');
            window.dispatchEvent(new Event('questline-session-expired'));
          }}
          id="logout"
          className="small logout-button"
          type="button"
          title="Đăng xuất"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};
