import React, { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';

export interface NavigationProps {
  currentScreen?: string;
  onNavigate?: (screen: string) => void;
  onLogout?: () => void;
  userName?: string;
  userEmail?: string;
}

const MOBILE_NAV_ITEMS = [
  {
    id: 'dashboard',
    shortLabel: 'Tổng quan',
    drawerLabel: 'Dashboard · Nhiệm vụ & Tiến độ',
    tabAriaLabel: 'Tab Tổng quan',
    icon: '◈'
  },
  {
    id: 'habits',
    shortLabel: 'Thói quen',
    drawerLabel: 'Thói quen & Chuỗi (Habit Tracker)',
    tabAriaLabel: 'Tab Thói quen',
    icon: '↻'
  },
  {
    id: 'badges',
    shortLabel: 'Huy hiệu',
    drawerLabel: 'Bộ sưu tập huy hiệu (Badges)',
    tabAriaLabel: 'Tab Huy hiệu',
    icon: '♔'
  },
  {
    id: 'profile',
    shortLabel: 'Hồ sơ',
    drawerLabel: 'Hồ sơ & Thành tích (Profile)',
    tabAriaLabel: 'Tab Hồ sơ',
    icon: '◎'
  }
] as const;

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen = 'dashboard',
  onNavigate,
  onLogout,
  userName = 'Minh Anh',
  userEmail = 'minhanh@example.com'
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const handleSelectScreen = (screen: string) => {
    onNavigate?.(screen);
    setIsDrawerOpen(false);
  };

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        onLogout={onLogout}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav
        className="mobile-bottom-nav"
        aria-label="Điều hướng di động"
        data-testid="mobile-bottom-nav"
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-tab ${isActive ? 'active' : ''}`}
              aria-label={item.tabAriaLabel}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleSelectScreen(item.id)}
            >
              <span className="mobile-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="mobile-nav-label">{item.shortLabel}</span>
            </button>
          );
        })}

        <button
          type="button"
          className={`mobile-nav-tab mobile-hamburger-btn ${isDrawerOpen ? 'active' : ''}`}
          aria-label="Mở menu điều hướng"
          aria-expanded={isDrawerOpen}
          aria-controls="mobile-nav-drawer"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
        >
          <span className="mobile-nav-icon" aria-hidden="true">
            ☰
          </span>
          <span className="mobile-nav-label">Menu</span>
        </button>
      </nav>

      {/* Mobile Hamburger Slide-over Drawer */}
      {isDrawerOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsDrawerOpen(false);
            }
          }}
        >
          <div
            id="mobile-nav-drawer"
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng di động"
          >
            <div className="mobile-drawer-head">
              <div className="brand">
                <span className="brandmark">q</span>questline
              </div>
              <button
                type="button"
                className="quiet mobile-drawer-close"
                aria-label="Đóng menu điều hướng"
                onClick={() => setIsDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mobile-drawer-links" role="menu">
              {MOBILE_NAV_ITEMS.map((item) => {
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleSelectScreen(item.id)}
                  >
                    <span className="mobile-drawer-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.drawerLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="mobile-drawer-footer">
              <div className="account-card">
                <div className="account-avatar" aria-hidden="true">
                  {getInitials(userName)}
                </div>
                <div className="account-info">
                  <b>{userName}</b>
                  <small>{userEmail}</small>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  className="logout-button mobile-drawer-logout"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onLogout();
                  }}
                >
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
