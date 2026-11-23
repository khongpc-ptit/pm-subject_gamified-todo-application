import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { apiClient } from '../services/api';

vi.mock('../services/api', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../pages/Dashboard', () => ({
  Dashboard: ({
    currentUser,
    onLogout,
    onUpdateUser
  }: {
    currentUser: { email: string; full_name?: string };
    onLogout: () => void;
    onUpdateUser?: (updated: any) => void;
  }) => (
    <main>
      <p>{currentUser.email}</p>
      <p data-testid="display-name">{currentUser.full_name || 'Chưa đặt tên'}</p>
      <button onClick={() => onUpdateUser?.({ ...currentUser, full_name: 'Tên Đã Đổi' })}>
        Đổi tên
      </button>
      <button onClick={onLogout}>Đăng xuất</button>
    </main>
  )
}));

const user = { email: 'owner@example.test', full_name: 'Nguyễn Chủ Sở Hữu' };

describe('Application authentication state & session lifecycle [TECH-S1-12]', () => {
  afterEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.resetAllMocks();
  });

  it('logs in, restores the session on a fresh mount and clears it on logout', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { user, token: 'test-token' } } });
    const initial = render(<App />);
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'fixture-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByText(user.email)).toBeInTheDocument();
    expect(screen.getByTestId('display-name')).toHaveTextContent(user.full_name);
    expect(localStorage.getItem('questline_jwt_token')).toBe('test-token');

    initial.unmount();
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: user } });
    const refreshed = render(<App />);
    expect(await screen.findByText(user.email)).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(localStorage.getItem('questline_jwt_token')).toBeNull();

    refreshed.unmount();
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('updates profile in session state when onUpdateUser is triggered', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { user, token: 'test-token' } } });
    render(<App />);
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'fixture-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByText(user.email)).toBeInTheDocument();

    expect(screen.getByTestId('display-name')).toHaveTextContent(user.full_name);
    fireEvent.click(screen.getByRole('button', { name: 'Đổi tên' }));
    expect(screen.getByTestId('display-name')).toHaveTextContent('Tên Đã Đổi');
  });

  it('returns to login when the active session expires', async () => {
    localStorage.setItem('questline_jwt_token', 'test-token');
    localStorage.setItem('questline_user', JSON.stringify(user));
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: user } });
    render(<App />);
    expect(await screen.findByText(user.email)).toBeInTheDocument();
    fireEvent(window, new Event('questline-session-expired'));
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(localStorage.getItem('questline_jwt_token')).toBeNull();
    expect(localStorage.getItem('questline_user')).toBeNull();
  });

  it('switches between Login and Registration views seamlessly', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();

    // Click button to switch to register mode
    fireEvent.click(screen.getByRole('button', { name: /Đăng ký/i }));
    expect(await screen.findByRole('button', { name: 'Tạo tài khoản' })).toBeInTheDocument();

    // Click link to switch back to login mode
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập ngay' }));
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
  });
});
