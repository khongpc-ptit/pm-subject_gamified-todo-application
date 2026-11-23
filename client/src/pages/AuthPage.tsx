import React, { useState } from 'react';
import { RegisterForm } from '../components/RegisterForm';
import type { AuthResponseData } from '../types/auth.types';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onAuthSuccess?: (data: AuthResponseData) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'register',
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  return (
    <div className="auth-page">
      <main className="login-card" aria-labelledby="login-title">
        {/* Brand Logo */}
        <div className="brand" aria-label="Questline">
          <span className="brand-mark" aria-hidden="true">q</span>
          <span className="brand-name">questline</span>
        </div>

        {/* Tiêu đề & Giới thiệu theo wireframe Authentication.html */}
        <h1 id="login-title">
          {mode === 'register' ? 'Bắt đầu hành trình.' : 'Chào mừng trở lại.'}
        </h1>
        <p className="intro" id="auth-intro">
          {mode === 'register'
            ? 'Tạo tài khoản để bắt đầu những mục tiêu mới.'
            : 'Tiếp tục những mục tiêu còn dang dở.'}
        </p>

        {/* Tab chuyển đổi Đăng nhập / Đăng ký */}
        <div className="auth-switch" role="group" aria-label="Chọn hình thức xác thực">
          <button
            id="login-mode"
            type="button"
            aria-pressed={mode === 'login'}
            onClick={() => setMode('login')}
          >
            Đăng nhập
          </button>
          <button
            id="register-mode"
            type="button"
            aria-pressed={mode === 'register'}
            onClick={() => setMode('register')}
          >
            Đăng ký
          </button>
        </div>

        {/* Nội dung form */}
        {mode === 'register' ? (
          <RegisterForm
            onSuccess={onAuthSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p className="intro">Chức năng đăng nhập sẽ được hoàn thiện trong task kế tiếp [TECH-S1-09].</p>
            <button
              type="button"
              className="submit-btn"
              onClick={() => setMode('register')}
            >
              Chuyển sang Đăng ký
            </button>
          </div>
        )}

        <p className="auth-note">Questline PC-GTD-01 · Hệ thống xác thực người dùng an toàn.</p>
      </main>
    </div>
  );
};

export default AuthPage;
