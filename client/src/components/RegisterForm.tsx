import React, { useState, useRef } from 'react';
import { authService } from '../services/auth.service';
import type { AuthResponseData } from '../types/auth.types';

interface RegisterFormProps {
  onSuccess?: (data: AuthResponseData) => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [successStatus, setSuccessStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset lỗi cũ
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');
    setSuccessStatus('');

    let hasError = false;

    // 1. Kiểm tra Họ và tên
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setFullNameError('Vui lòng nhập họ và tên.');
      hasError = true;
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      setFullNameError('Họ và tên phải có độ dài từ 2 đến 100 ký tự.');
      hasError = true;
    }

    // 2. Kiểm tra Email
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      setEmailError('Vui lòng nhập email.');
      hasError = true;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Email chưa đúng định dạng.');
      hasError = true;
    }

    // 3. Kiểm tra Mật khẩu
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải có tối thiểu 6 ký tự.');
      hasError = true;
    }

    // 4. Kiểm tra Mật khẩu xác nhận
    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng nhập lại mật khẩu.');
      hasError = true;
    } else if (password && confirmPassword !== password) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp.');
      hasError = true;
    }

    // Focus vào ô lỗi đầu tiên
    if (hasError) {
      if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
        fullNameRef.current?.focus();
      } else if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
        emailRef.current?.focus();
      } else if (!password || password.length < 6) {
        passwordRef.current?.focus();
      } else {
        confirmPasswordRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await authService.register({
        email: trimmedEmail,
        password,
        full_name: trimmedName
      });

      setSuccessStatus('Đăng ký tài khoản thành công!');
      onSuccess?.(data);
    } catch (err: any) {
      if (err.code === 'EMAIL_ALREADY_EXISTS' || err.status === 409 || err.message?.includes('đã được sử dụng')) {
        setEmailError('Email này đã được sử dụng.');
        emailRef.current?.focus();
      } else {
        setGeneralError(err.message || 'Đăng ký tài khoản thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="register-form" onSubmit={handleSubmit} noValidate aria-label="Biểu mẫu đăng ký tài khoản">
      {/* Trường Họ và tên */}
      <div className="field" id="full-name-field">
        <label htmlFor="fullName">Họ và tên</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          ref={fullNameRef}
          autoComplete="name"
          placeholder="Nguyễn Minh Anh"
          value={fullName}
          aria-invalid={!!fullNameError}
          aria-describedby={fullNameError ? 'fullName-error' : undefined}
          onChange={(e) => {
            setFullName(e.target.value);
            if (fullNameError) setFullNameError('');
          }}
        />
        {fullNameError && (
          <p id="fullName-error" className="error error-text" role="alert" aria-live="polite">
            {fullNameError}
          </p>
        )}
      </div>

      {/* Trường Email */}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          ref={emailRef}
          autoComplete="username"
          placeholder="ban@example.com"
          value={email}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'email-error' : undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
          }}
        />
        {emailError && (
          <p id="email-error" className="error error-text" role="alert" aria-live="polite">
            {emailError}
          </p>
        )}
      </div>

      {/* Trường Mật khẩu */}
      <div className="field">
        <label htmlFor="password">Mật khẩu</label>
        <div className="password-wrap">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            ref={passwordRef}
            autoComplete="new-password"
            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
            value={password}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-error' : undefined}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
          />
          <button
            id="toggle-password"
            className="password-toggle"
            type="button"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            aria-controls="password"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
        {passwordError && (
          <p id="password-error" className="error error-text" role="alert" aria-live="polite">
            {passwordError}
          </p>
        )}
      </div>

      {/* Trường Xác nhận Mật khẩu */}
      <div className="field">
        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
        <div className="password-wrap">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            ref={confirmPasswordRef}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            aria-invalid={!!confirmPasswordError}
            aria-describedby={confirmPasswordError ? 'confirmPassword-error' : undefined}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmPasswordError) setConfirmPasswordError('');
            }}
          />
          <button
            id="toggle-confirm-password"
            className="password-toggle"
            type="button"
            aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showConfirmPassword}
            aria-controls="confirmPassword"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
        {confirmPasswordError && (
          <p id="confirmPassword-error" className="error error-text" role="alert" aria-live="polite">
            {confirmPasswordError}
          </p>
        )}
      </div>

      {/* Thông báo lỗi tổng quát */}
      {generalError && (
        <p id="general-error" className="status-msg error-banner" role="alert">
          {generalError}
        </p>
      )}

      {/* Nút Submit */}
      <button
        className="submit submit-btn"
        id="submit-button"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
      </button>

      {/* Thông báo thành công */}
      {successStatus && (
        <p id="login-status" className="status status-msg" role="status" aria-live="polite">
          {successStatus}
        </p>
      )}

      {onSwitchToLogin && (
        <p className="auth-note" style={{ textAlign: 'center' }}>
          Đã có tài khoản?{' '}
          <button
            type="button"
            style={{ border: 'none', background: 'none', color: 'var(--green)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
            onClick={onSwitchToLogin}
          >
            Đăng nhập ngay
          </button>
        </p>
      )}
    </form>
  );
};

export default RegisterForm;
