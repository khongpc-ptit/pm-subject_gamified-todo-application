import { useRef, useState } from 'react';
import { apiClient } from '../services/api';
import { authService } from '../services/auth.service';
export function PasswordReset() {
  const token = new URLSearchParams(window.location.search).get('token');
  const resetting = window.location.pathname === '/reset-password';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  return <main className="main"><section className="card" style={{ maxWidth: 460, margin: '60px auto' }}>
    <h1>{resetting ? 'Đặt lại mật khẩu' : 'Quên mật khẩu'}</h1>
    <form onSubmit={async event => {
      event.preventDefault();
      if (busy.current) return;
      setError(''); setMessage('');
      if (resetting && (!token || password !== confirm || password.length < 6 || new TextEncoder().encode(password).length > 72)) { setError('Kiểm tra liên kết và xác nhận mật khẩu (6–72 byte).'); return; }
      busy.current = true; setPending(true);
      try {
        const response = await apiClient.post(resetting ? '/auth/reset-password' : '/auth/forgot-password', resetting ? { token, password } : { email });
        setMessage(response.data.message);
        setPassword(''); setConfirm('');
        if (resetting) { authService.logout(); window.history.replaceState({}, '', '/reset-password'); }
      } catch { setError('Không thể xử lý yêu cầu. Kiểm tra liên kết hoặc thử lại sau.'); }
      finally { busy.current = false; setPending(false); }
    }}>
      {resetting ? <><label htmlFor="new-password">Mật khẩu mới</label><input id="new-password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /><label htmlFor="confirm-password">Xác nhận mật khẩu</label><input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></> : <><label htmlFor="reset-email">Email</label><input id="reset-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></>}
      {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <button className="primary" disabled={pending}>{pending ? 'Đang xử lý…' : 'Gửi yêu cầu'}</button>
    </form><a href="/login">Về đăng nhập</a>
  </section></main>;
}
