import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterForm } from '../components/RegisterForm';
import { AuthPage } from '../pages/AuthPage';
import { authService } from '../services/auth.service';

describe('Frontend: [US-S1-05 / TECH-S1-08] RegisterForm Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Render đầy đủ các trường nhập liệu của biểu mẫu đăng ký', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/Họ và tên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Xác nhận mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tạo tài khoản/i })).toBeInTheDocument();
  });

  it('2. Validate lỗi khi thiếu hoặc họ và tên không đúng độ dài', async () => {
    render(<RegisterForm />);

    const submitBtn = screen.getByRole('button', { name: /Tạo tài khoản/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Vui lòng nhập họ và tên.')).toBeInTheDocument();

    // Nhập họ và tên < 2 ký tự
    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'A' } });
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Họ và tên phải có độ dài từ 2 đến 100 ký tự.')).toBeInTheDocument();
  });

  it('3. Validate lỗi khi email trống hoặc sai định dạng', async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Nguyễn Văn A' } });
    const submitBtn = screen.getByRole('button', { name: /Tạo tài khoản/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Vui lòng nhập email.')).toBeInTheDocument();

    // Nhập email sai định dạng
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'invalid-email' } });
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Email chưa đúng định dạng.')).toBeInTheDocument();
  });

  it('4. Validate lỗi khi mật khẩu trống hoặc ít hơn 6 ký tự', async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Nguyễn Văn A' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'vana@example.com' } });
    const submitBtn = screen.getByRole('button', { name: /Tạo tài khoản/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument();

    // Mật khẩu < 6 ký tự
    fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: '123' } });
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Mật khẩu phải có tối thiểu 6 ký tự.')).toBeInTheDocument();
  });

  it('5. Validate lỗi khi mật khẩu xác nhận không khớp', async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Nguyễn Văn A' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'vana@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: 'Password@123' } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: 'Password@999' } });

    const submitBtn = screen.getByRole('button', { name: /Tạo tài khoản/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument();
  });

  it('6. Hỗ trợ bật/tắt hiển thị mật khẩu (Show/Hide Password toggle)', () => {
    const { container } = render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^Mật khẩu/i) as HTMLInputElement;
    const toggleBtn = container.querySelector('#toggle-password') as HTMLButtonElement;

    expect(passwordInput.type).toBe('password');
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');
    expect(toggleBtn).toHaveTextContent('Ẩn');

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
    expect(toggleBtn).toHaveTextContent('Hiện');
  });

  it('7. Đăng ký thành công gọi authService.register và trigger callback onSuccess', async () => {
    const mockAuthResponse = {
      token: 'mock-jwt-token-xyz',
      user: {
        _id: 'user-01',
        email: 'nguyenvana@example.com',
        full_name: 'Nguyễn Văn A',
        current_level: 1,
        total_xp: 0,
        current_streak: 0,
        last_active_date: null,
        streak_freeze_count: 1,
        created_at: new Date().toISOString()
      }
    };

    const registerSpy = vi.spyOn(authService, 'register').mockResolvedValue(mockAuthResponse);
    const handleSuccess = vi.fn();

    render(<RegisterForm onSuccess={handleSuccess} />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: '  Nguyễn Văn A  ' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: '  nguyenvana@example.com  ' } });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: 'SecretPassword123' } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: 'SecretPassword123' } });

    const submitBtn = screen.getByRole('button', { name: /Tạo tài khoản/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        full_name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        password: 'SecretPassword123'
      });
      expect(handleSuccess).toHaveBeenCalledWith(mockAuthResponse);
      expect(screen.getByText('Đăng ký tài khoản thành công!')).toBeInTheDocument();
    });
  });

  it('8. Hiển thị lỗi inline tại ô Email khi Backend trả về mã lỗi 409 EMAIL_ALREADY_EXISTS', async () => {
    const conflictError: any = new Error('Email này đã được sử dụng.');
    conflictError.code = 'EMAIL_ALREADY_EXISTS';
    conflictError.status = 409;

    vi.spyOn(authService, 'register').mockRejectedValue(conflictError);

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Nguyễn Văn B' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'used@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: 'Password@123' } });
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), { target: { value: 'Password@123' } });

    const submitBtn = screen.getByRole('button', { name: /Tạo tài khoản/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Email này đã được sử dụng.')).toBeInTheDocument();
  });
});

describe('Frontend: AuthPage Container & Mode Switch', () => {
  it('9. Hiển thị tiêu đề và chuyển đổi giữa tab Đăng ký và Đăng nhập', () => {
    const { container } = render(<AuthPage initialMode="register" />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bắt đầu hành trình.');
    expect(container.querySelector('#register-mode')).toHaveAttribute('aria-pressed', 'true');

    // Chuyển sang tab Đăng nhập
    const loginTabBtn = container.querySelector('#login-mode') as HTMLButtonElement;
    fireEvent.click(loginTabBtn);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Chào mừng trở lại.');
    expect(loginTabBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
