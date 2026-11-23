import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types/auth.types';
import { authService } from '../services/auth.service';

export interface ProfilePageProps {
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onNavigateBack?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onUpdateUser,
  onNavigateBack
}) => {
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFullName(currentUser.full_name || '');
  }, [currentUser.full_name]);

  const getInitials = (name: string): string => {
    if (!name || !name.trim()) return 'QL';
    return name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  };

  const validate = (): boolean => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setNameError('Vui lòng nhập họ và tên.');
      return false;
    }
    if (trimmed.length < 2 || trimmed.length > 100) {
      setNameError('Họ và tên phải có độ dài từ 2 đến 100 ký tự.');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const updated = await authService.updateProfile({
        full_name: fullName.trim()
      });
      onUpdateUser(updated);
      setSuccessMessage('Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFullName(currentUser.full_name || '');
    setNameError('');
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  return (
    <div className="profile-page" data-testid="profile-page">
      {/* 1. Header Trang Hồ sơ */}
      <div className="page-title">
        <div>
          <div className="eyebrow">03 / PROFILE &amp; ACHIEVEMENTS</div>
          <h1>Thành quả của sự bền bỉ.</h1>
          <p>Nhìn lại hành trình. Sẵn sàng cho cột mốc tiếp theo.</p>
        </div>
        {onNavigateBack && (
          <button
            type="button"
            className="small"
            onClick={onNavigateBack}
            data-testid="back-to-dashboard"
          >
            ← Về Dashboard
          </button>
        )}
      </div>

      {/* 2. Thẻ hiển thị hồ sơ cá nhân (Profile Card) */}
      <section className="card profile-card" data-testid="profile-card">
        <div
          className="profile-avatar"
          data-testid="profile-avatar"
          aria-label={`Ảnh đại diện ${currentUser.full_name}`}
        >
          {getInitials(currentUser.full_name)}
        </div>
        <div style={{ minWidth: 200 }}>
          <h2 style={{ margin: '0 0 4px 0' }} data-testid="profile-name">
            {currentUser.full_name}
          </h2>
          <p
            className="helper"
            style={{ margin: '0 0 8px 0', color: 'var(--muted)', fontSize: 13 }}
            data-testid="profile-email"
          >
            {currentUser.email}
          </p>
          <span className="pill" data-testid="profile-level-badge">
            Chiến binh · Cấp {currentUser.current_level}
          </span>
        </div>
        <div className="stats-grid">
          <div>
            <b data-testid="profile-xp">{currentUser.total_xp.toLocaleString('vi-VN')}</b>
            <small>XP toàn thời gian</small>
          </div>
          <div>
            <b data-testid="profile-streak">{currentUser.current_streak} ngày</b>
            <small>Chuỗi hiện tại</small>
          </div>
          <div>
            <b data-testid="profile-freeze">{currentUser.streak_freeze_count} lượt</b>
            <small>Đóng băng chuỗi</small>
          </div>
        </div>
      </section>

      {/* 3. Biểu mẫu chỉnh sửa thông tin cá nhân */}
      <section className="card" style={{ marginBottom: 24 }} data-testid="profile-edit-section">
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>Chỉnh sửa thông tin cá nhân</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            Cập nhật tên hiển thị của bạn trên bảng nhiệm vụ và thành tích.
          </p>
        </div>

        {successMessage && (
          <div
            className="card"
            style={{
              background: '#eaf0e6',
              borderColor: '#c8d6c2',
              color: 'var(--green)',
              padding: '12px 16px',
              marginBottom: 16,
              fontWeight: 600
            }}
            role="status"
            data-testid="profile-success-msg"
          >
            ✓ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            className="card"
            style={{
              background: '#fdf2f2',
              borderColor: '#f5c6cb',
              color: '#a04438',
              padding: '12px 16px',
              marginBottom: 16,
              fontWeight: 600
            }}
            role="alert"
            data-testid="profile-error-msg"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate data-testid="profile-edit-form">
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="profile-fullName">Họ và tên</label>
            <input
              id="profile-fullName"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="Nhập họ và tên đầy đủ"
              aria-describedby={nameError ? 'profile-fullName-error' : undefined}
              data-testid="input-fullname"
            />
            {nameError && (
              <div
                className="error"
                id="profile-fullName-error"
                role="alert"
                data-testid="error-fullname"
              >
                {nameError}
              </div>
            )}
            <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
              Họ và tên hiển thị công khai, có độ dài từ 2 đến 100 ký tự.
            </small>
          </div>

          <div className="field" style={{ marginBottom: 20 }}>
            <label htmlFor="profile-email">Email tài khoản</label>
            <input
              id="profile-email"
              name="email"
              type="email"
              value={currentUser.email}
              disabled
              readOnly
              style={{ background: '#f5f5f0', cursor: 'not-allowed', color: '#737d79' }}
              data-testid="input-email-readonly"
            />
            <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
              Email dùng để xác thực và nhận thông báo, không thể thay đổi theo quy chuẩn bảo mật.
            </small>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              className="primary"
              disabled={isSubmitting}
              data-testid="btn-save-profile"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button
              type="button"
              className="quiet"
              onClick={handleReset}
              disabled={isSubmitting || fullName === currentUser.full_name}
              data-testid="btn-reset-profile"
            >
              Đặt lại
            </button>
          </div>
        </form>
      </section>

      {/* 4. Thành tích & Cột mốc Huy hiệu (Gamification Badges) */}
      <section className="card" data-testid="profile-badges-section">
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>Cột mốc thành tích</h2>
        <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--muted)' }}>
          Huy hiệu mở khóa khi duy trì kỷ luật và hoàn thành các nhiệm vụ quan trọng.
        </p>

        <div className="badgegrid">
          <article className="badge">
            <div className="badge-symbol">⚑</div>
            <h3>Khởi đầu nan</h3>
            <p>Hoàn thành công việc đầu tiên trên Questline.</p>
            <span className="pill">✓ Đã mở khóa</span>
          </article>

          <article className={`badge ${currentUser.current_streak >= 7 ? '' : 'locked'}`}>
            <div className="badge-symbol">♨</div>
            <h3>7 ngày bền bỉ</h3>
            <p>Duy trì daily streak trong 7 ngày liên tiếp.</p>
            {currentUser.current_streak >= 7 ? (
              <span className="pill">✓ Đã mở khóa</span>
            ) : (
              <small>{currentUser.current_streak} / 7 ngày · Đang phấn đấu</small>
            )}
          </article>

          <article className={`badge ${currentUser.current_level >= 5 ? '' : 'locked'}`}>
            <div className="badge-symbol">♜</div>
            <h3>Cột mốc cấp 5</h3>
            <p>Đạt cấp độ 5 trên hành trình phát triển bản thân.</p>
            {currentUser.current_level >= 5 ? (
              <span className="pill">✓ Đã mở khóa</span>
            ) : (
              <small>Cấp {currentUser.current_level} / 5 · Đang phấn đấu</small>
            )}
          </article>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
