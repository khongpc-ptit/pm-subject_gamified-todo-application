import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';
import { authService } from '../services/auth.service';
import { taskService } from '../services/task.service';
import type { UserProfile } from '../types/auth.types';

vi.mock('../services/auth.service', () => ({
  authService: {
    updateProfile: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn()
  }
}));

vi.mock('../services/task.service', () => ({
  taskService: {
    getTasks: vi.fn().mockResolvedValue({ tasks: [], total: 0 }),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    completeTask: vi.fn()
  }
}));

const mockUser: UserProfile = {
  _id: '672a11112222333344445555',
  email: 'hero@questline.test',
  full_name: 'Chiến Binh Dũng Cảm',
  current_level: 2,
  total_xp: 350,
  current_streak: 5,
  streak_freeze_count: 2,
  last_active_date: '2026-11-23',
  created_at: '2026-11-01T10:00:00.000Z'
};

describe('Client Integration: [US-S1-07 / US-S1-08 / TECH-S1-12] Dashboard & Profile Navigation & Updates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(taskService.getTasks).mockResolvedValue({ tasks: [], total: 0 });
  });

  it('navigates from Dashboard to Profile, displays gamification stats, updates profile name and reflects in UI', async () => {
    let currentUserState = { ...mockUser };
    const handleUpdateUser = vi.fn((updated: UserProfile) => {
      currentUserState = updated;
    });
    const handleLogout = vi.fn();

    const { rerender } = render(
      <Dashboard
        currentUser={currentUserState}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
      />
    );

    // 1. Initial Dashboard view shows user name in sidebar
    expect(screen.getByText('Chiến Binh Dũng Cảm')).toBeInTheDocument();

    // 2. Navigate to Profile page via Sidebar button
    const profileNavBtn = screen.getByRole('button', { name: /Profile & Achievements/i });
    fireEvent.click(profileNavBtn);

    // 3. Verify ProfilePage elements are rendered with exact user stats [US-S1-07]
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Chiến Binh Dũng Cảm');
    expect(screen.getByTestId('profile-email')).toHaveTextContent('hero@questline.test');
    expect(screen.getByTestId('profile-xp')).toHaveTextContent('350');
    expect(screen.getByTestId('profile-level-badge')).toHaveTextContent('Chiến binh · Cấp 2');
    expect(screen.getByTestId('profile-streak')).toHaveTextContent('5 ngày');
    expect(screen.getByTestId('profile-freeze')).toHaveTextContent('2 lượt');

    // 4. Update profile name [US-S1-08]
    const updatedUser: UserProfile = {
      ...mockUser,
      full_name: 'Chiến Binh Huyền Thoại'
    };
    vi.mocked(authService.updateProfile).mockResolvedValue(updatedUser);

    const nameInput = screen.getByTestId('input-fullname');
    fireEvent.change(nameInput, { target: { value: 'Chiến Binh Huyền Thoại' } });

    const saveBtn = screen.getByTestId('btn-save-profile');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith({ full_name: 'Chiến Binh Huyền Thoại' });
      expect(handleUpdateUser).toHaveBeenCalledWith(updatedUser);
    });

    // 5. Rerender with updated user to simulate state update from App component
    rerender(
      <Dashboard
        currentUser={currentUserState}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
      />
    );

    // 6. Navigate back to Dashboard screen using back button
    const backBtn = screen.getByTestId('back-to-dashboard');
    fireEvent.click(backBtn);

    // Verify updated user name is shown in the sidebar header
    expect(screen.getByText('Chiến Binh Huyền Thoại')).toBeInTheDocument();

    // 7. Verify logout triggers onLogout callback
    const logoutBtn = screen.getByRole('button', { name: /Đăng xuất/i });
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid profile name on form submission without calling the API', async () => {
    render(<Dashboard currentUser={mockUser} />);

    // Navigate to profile
    fireEvent.click(screen.getByRole('button', { name: /Profile & Achievements/i }));

    const nameInput = screen.getByTestId('input-fullname');
    const saveBtn = screen.getByTestId('btn-save-profile');

    // Test empty name validation
    fireEvent.change(nameInput, { target: { value: '   ' } });
    fireEvent.click(saveBtn);

    expect(await screen.findByTestId('error-fullname')).toHaveTextContent('Vui lòng nhập họ và tên.');
    expect(authService.updateProfile).not.toHaveBeenCalled();

    // Test name < 2 chars validation
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.click(saveBtn);

    expect(await screen.findByTestId('error-fullname')).toHaveTextContent(
      'Họ và tên phải có độ dài từ 2 đến 100 ký tự.'
    );
    expect(authService.updateProfile).not.toHaveBeenCalled();
  });
});
