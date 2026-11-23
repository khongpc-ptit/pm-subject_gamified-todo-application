import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfilePage } from '../pages/ProfilePage';
import { authService } from '../services/auth.service';
import type { UserProfile } from '../types/auth.types';

const mockUser: UserProfile = {
  _id: '672a11112222333344445555',
  email: 'hung.lm@ptit.edu.vn',
  full_name: 'Lê Mạnh Hùng',
  current_level: 3,
  total_xp: 950,
  current_streak: 8,
  last_active_date: '2026-11-20',
  streak_freeze_count: 2,
  created_at: '2026-11-01T10:00:00.000Z'
};

describe('Frontend: [US-S1-07 / US-S1-08 / TECH-S1-10] ProfilePage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Hiển thị chính xác thông tin hồ sơ và các chỉ số gamification [US-S1-07]', () => {
    render(<ProfilePage currentUser={mockUser} onUpdateUser={vi.fn()} />);

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Lê Mạnh Hùng');
    expect(screen.getByTestId('profile-email')).toHaveTextContent('hung.lm@ptit.edu.vn');
    expect(screen.getByTestId('profile-avatar')).toHaveTextContent('MH');
    expect(screen.getByTestId('profile-level-badge')).toHaveTextContent('Chiến binh · Cấp 3');
    expect(screen.getByTestId('profile-xp')).toHaveTextContent('950');
    expect(screen.getByTestId('profile-streak')).toHaveTextContent('8 ngày');
    expect(screen.getByTestId('profile-freeze')).toHaveTextContent('2 lượt');
  });

  it('2. Khởi tạo biểu mẫu với họ tên hiện tại và trường email read-only', () => {
    render(<ProfilePage currentUser={mockUser} onUpdateUser={vi.fn()} />);

    const nameInput = screen.getByTestId('input-fullname') as HTMLInputElement;
    const emailInput = screen.getByTestId('input-email-readonly') as HTMLInputElement;

    expect(nameInput.value).toBe('Lê Mạnh Hùng');
    expect(emailInput.value).toBe('hung.lm@ptit.edu.vn');
    expect(emailInput).toBeDisabled();
  });

  it('3. Validate lỗi khi họ và tên rỗng hoặc ít hơn 2 ký tự [US-S1-08]', async () => {
    render(<ProfilePage currentUser={mockUser} onUpdateUser={vi.fn()} />);

    const nameInput = screen.getByTestId('input-fullname');
    const saveBtn = screen.getByTestId('btn-save-profile');

    // Trường hợp rỗng
    fireEvent.change(nameInput, { target: { value: '   ' } });
    fireEvent.click(saveBtn);
    expect(await screen.findByTestId('error-fullname')).toHaveTextContent('Vui lòng nhập họ và tên.');

    // Trường hợp ít hơn 2 ký tự
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.click(saveBtn);
    expect(await screen.findByTestId('error-fullname')).toHaveTextContent(
      'Họ và tên phải có độ dài từ 2 đến 100 ký tự.'
    );
  });

  it('4. Validate lỗi khi họ và tên vượt quá 100 ký tự [US-S1-08]', async () => {
    render(<ProfilePage currentUser={mockUser} onUpdateUser={vi.fn()} />);

    const nameInput = screen.getByTestId('input-fullname');
    const saveBtn = screen.getByTestId('btn-save-profile');

    fireEvent.change(nameInput, { target: { value: 'A'.repeat(101) } });
    fireEvent.click(saveBtn);
    expect(await screen.findByTestId('error-fullname')).toHaveTextContent(
      'Họ và tên phải có độ dài từ 2 đến 100 ký tự.'
    );
  });

  it('5. Nút Đặt lại khôi phục giá trị họ tên ban đầu và xóa cảnh báo lỗi', async () => {
    render(<ProfilePage currentUser={mockUser} onUpdateUser={vi.fn()} />);

    const nameInput = screen.getByTestId('input-fullname') as HTMLInputElement;
    const resetBtn = screen.getByTestId('btn-reset-profile');
    const saveBtn = screen.getByTestId('btn-save-profile');

    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.click(saveBtn);
    expect(await screen.findByTestId('error-fullname')).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(nameInput.value).toBe('Lê Mạnh Hùng');
    expect(screen.queryByTestId('error-fullname')).not.toBeInTheDocument();
  });

  it('6. Cập nhật hồ sơ thành công, gọi onUpdateUser và hiển thị thông báo [US-S1-08]', async () => {
    const updatedUser: UserProfile = {
      ...mockUser,
      full_name: 'Lê Hoàng Long'
    };
    vi.spyOn(authService, 'updateProfile').mockResolvedValue(updatedUser);
    const onUpdateUserMock = vi.fn();

    render(<ProfilePage currentUser={mockUser} onUpdateUser={onUpdateUserMock} />);

    const nameInput = screen.getByTestId('input-fullname');
    const saveBtn = screen.getByTestId('btn-save-profile');

    fireEvent.change(nameInput, { target: { value: '  Lê Hoàng Long  ' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith({
        full_name: 'Lê Hoàng Long'
      });
      expect(onUpdateUserMock).toHaveBeenCalledWith(updatedUser);
      expect(screen.getByTestId('profile-success-msg')).toHaveTextContent('Cập nhật hồ sơ thành công!');
    });
  });

  it('7. Hiển thị thông báo lỗi khi API cập nhật hồ sơ trả về lỗi', async () => {
    vi.spyOn(authService, 'updateProfile').mockRejectedValue(new Error('Lỗi từ máy chủ Backend'));

    render(<ProfilePage currentUser={mockUser} onUpdateUser={vi.fn()} />);

    const nameInput = screen.getByTestId('input-fullname');
    const saveBtn = screen.getByTestId('btn-save-profile');

    fireEvent.change(nameInput, { target: { value: 'Tên Hợp Lệ Mới' } });
    fireEvent.click(saveBtn);

    expect(await screen.findByTestId('profile-error-msg')).toHaveTextContent('Lỗi từ máy chủ Backend');
  });

  it('8. Nút quay lại Dashboard kích hoạt callback onNavigateBack', () => {
    const onNavigateBackMock = vi.fn();
    render(
      <ProfilePage
        currentUser={mockUser}
        onUpdateUser={vi.fn()}
        onNavigateBack={onNavigateBackMock}
      />
    );

    const backBtn = screen.getByTestId('back-to-dashboard');
    fireEvent.click(backBtn);
    expect(onNavigateBackMock).toHaveBeenCalledTimes(1);
  });
});
