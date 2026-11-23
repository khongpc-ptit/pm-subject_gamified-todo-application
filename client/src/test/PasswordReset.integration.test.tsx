import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PasswordReset } from '../pages/PasswordReset';
import { apiClient } from '../services/api';

vi.mock('../services/api', () => ({ apiClient: { post: vi.fn() } }));

describe('Password recovery forms', () => {
  afterEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.resetAllMocks();
  });

  it('posts the email and displays the generic request confirmation', async () => {
    window.history.replaceState({}, '', '/forgot-password');
    vi.mocked(apiClient.post).mockResolvedValue({ data: { message: 'Kiểm tra email của bạn' } });
    render(<PasswordReset />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Kiểm tra email của bạn');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'owner@example.test' });
  });

  it('checks confirmation, submits the reset and clears the token from browser state', async () => {
    const token = 'a'.repeat(64);
    window.history.replaceState({}, '', '/reset-password?token=' + token);
    localStorage.setItem('questline_jwt_token', 'old-session');
    localStorage.setItem('questline_user', '{}');
    vi.mocked(apiClient.post).mockResolvedValue({ data: { message: 'Đặt lại mật khẩu thành công' } });
    render(<PasswordReset />);
    const newPassword = screen.getByLabelText('Mật khẩu mới');
    const confirm = screen.getByLabelText('Xác nhận mật khẩu');
    const submit = screen.getByRole('button', { name: 'Gửi yêu cầu' });
    fireEvent.change(newPassword, { target: { value: 'new-password' } });
    fireEvent.change(confirm, { target: { value: 'different' } });
    fireEvent.click(submit);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();

    fireEvent.change(confirm, { target: { value: 'new-password' } });
    fireEvent.click(submit);
    expect(await screen.findByRole('status')).toHaveTextContent('Đặt lại mật khẩu thành công');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', { token, password: 'new-password' });
    expect(window.location.search).toBe('');
    expect(localStorage.getItem('questline_jwt_token')).toBeNull();
    expect(localStorage.getItem('questline_user')).toBeNull();
    expect(newPassword).toHaveValue('');
  });

  it('shows an error and retains the fields when the server rejects the reset', async () => {
    window.history.replaceState({}, '', '/reset-password?token=' + 'b'.repeat(64));
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Expired token'));
    render(<PasswordReset />);
    const newPassword = screen.getByLabelText('Mật khẩu mới');
    fireEvent.change(newPassword, { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: 'new-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(newPassword).toHaveValue('new-password');
  });
});
