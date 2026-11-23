import { useRef, useState } from 'react';
import { apiClient } from '../services/api';
import type { AuthResponseData, UserProfile } from '../types/auth.types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
  onSwitchToRegister: () => void;
}

export function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  return <main className="main"><section className="card" style={{ maxWidth: 460, margin: '60px auto' }}>
    <h1>Đăng nhập</h1>
    <form onSubmit={async event => {
      event.preventDefault();
      if (busy.current) return;
      busy.current = true; setPending(true); setError('');
      try {
        const response = await apiClient.post<{ data: AuthResponseData }>('/auth/login', { email, password });
        localStorage.setItem('questline_jwt_token', response.data.data.token);
        onLogin(response.data.data.user);
      } catch (error: unknown) {
        const failure = error as { response?: { data?: { error?: { message?: string } } } };
        setError(failure.response?.data?.error?.message || 'Không thể đăng nhập. Vui lòng thử lại.');
      } finally { busy.current = false; setPending(false); }
    }}>
      <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
      <label htmlFor="password">Mật khẩu</label><input id="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
      <button type="button" onClick={() => setVisible(!visible)}>{visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</button>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="primary" disabled={pending}>{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    </form>
    <button type="button" onClick={onSwitchToRegister}>Đăng ký</button>
    <a href="/forgot-password">Quên mật khẩu?</a>
  </section></main>;
}
