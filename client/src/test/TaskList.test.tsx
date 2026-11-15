import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { TaskList } from '../components/TaskList';
import { TaskRow } from '../components/TaskRow';
import type { Task } from '../types/task.types';

const mockTasks: Task[] = [
  {
    _id: '1',
    user_id: 'user-1',
    title: 'Học React và TypeScript',
    description: 'Đọc tài liệu',
    priority: 'HIGH',
    status: 'TODO',
    due_date: '2026-11-10T17:00:00.000Z',
    xp_reward: 30,
    completed_at: null,
    created_at: '2026-11-01T00:00:00.000Z'
  },
  {
    _id: '2',
    user_id: 'user-1',
    title: 'Hoàn thành bài tập về nhà',
    description: '',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    due_date: null,
    xp_reward: 20,
    completed_at: '2026-11-02T12:00:00.000Z',
    created_at: '2026-11-01T00:00:00.000Z'
  }
];

describe('Frontend: [US-S1-02 / TECH-S1-03] TaskList Component', () => {
  it('1. Hiển thị Loading Skeleton khi đang tải dữ liệu', () => {
    render(
      <TaskList
        tasks={[]}
        allTasksCount={0}
        todoTasks={[]}
        completedTasks={[]}
        loading={true}
        error={null}
        priorityFilter="ALL"
        onFilterChange={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    const loadingRegion = screen.getByRole('status');
    expect(loadingRegion).toBeInTheDocument();
    expect(loadingRegion).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Đang tải dữ liệu…')).toBeInTheDocument();
  });

  it('2. Hiển thị Empty State khi người dùng chưa có nhiệm vụ nào', () => {
    const handleFocusCreate = vi.fn();
    render(
      <TaskList
        tasks={[]}
        allTasksCount={0}
        todoTasks={[]}
        completedTasks={[]}
        loading={false}
        error={null}
        priorityFilter="ALL"
        onFilterChange={vi.fn()}
        onRetry={vi.fn()}
        onFocusCreate={handleFocusCreate}
      />
    );

    expect(screen.getByText('Hành trình bắt đầu từ một việc nhỏ')).toBeInTheDocument();
    expect(
      screen.getByText('Thêm công việc đầu tiên của bạn và nhận XP khi hoàn thành.')
    ).toBeInTheDocument();

    const ctaButton = screen.getByText('＋ Tạo công việc đầu tiên');
    expect(ctaButton).toBeInTheDocument();
    fireEvent.click(ctaButton);
    expect(handleFocusCreate).toHaveBeenCalledTimes(1);
  });

  it('3. Hiển thị Error Alert kèm nút Thử lại khi xảy ra lỗi kết nối', () => {
    const handleRetry = vi.fn();
    render(
      <TaskList
        tasks={[]}
        allTasksCount={0}
        todoTasks={[]}
        completedTasks={[]}
        loading={false}
        error="Kết nối bị gián đoạn. Hãy thử lại để tiếp tục."
        priorityFilter="ALL"
        onFilterChange={vi.fn()}
        onRetry={handleRetry}
      />
    );

    const alertRegion = screen.getByRole('alert');
    expect(alertRegion).toBeInTheDocument();
    expect(screen.getByText('Chưa tải được dữ liệu')).toBeInTheDocument();
    expect(
      screen.getByText('Kết nối bị gián đoạn. Hãy thử lại để tiếp tục.')
    ).toBeInTheDocument();

    const retryButton = screen.getByText('Thử lại');
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('4. Hiển thị danh sách công việc phân chia theo nhóm TODO và COMPLETED', () => {
    const todoTasks = mockTasks.filter((t) => t.status !== 'COMPLETED');
    const completedTasks = mockTasks.filter((t) => t.status === 'COMPLETED');

    render(
      <TaskList
        tasks={mockTasks}
        allTasksCount={2}
        todoTasks={todoTasks}
        completedTasks={completedTasks}
        loading={false}
        error={null}
        priorityFilter="ALL"
        onFilterChange={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('TODO')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('Học React và TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Hoàn thành bài tập về nhà')).toBeInTheDocument();
  });

  it('5. Hiển thị thông báo khi bộ lọc không có công việc phù hợp', () => {
    const handleFilterChange = vi.fn();
    render(
      <TaskList
        tasks={[]}
        allTasksCount={2}
        todoTasks={[]}
        completedTasks={[]}
        loading={false}
        error={null}
        priorityFilter="LOW"
        onFilterChange={handleFilterChange}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('Không có việc phù hợp')).toBeInTheDocument();
    const clearFilterBtn = screen.getByText('Xóa bộ lọc');
    fireEvent.click(clearFilterBtn);
    expect(handleFilterChange).toHaveBeenCalledWith('ALL');
  });

  it('6. Kích hoạt sự kiện thay đổi bộ lọc khi người dùng chọn priority', () => {
    const handleFilterChange = vi.fn();
    render(
      <TaskList
        tasks={mockTasks}
        allTasksCount={2}
        todoTasks={[mockTasks[0]]}
        completedTasks={[mockTasks[1]]}
        loading={false}
        error={null}
        priorityFilter="ALL"
        onFilterChange={handleFilterChange}
        onRetry={vi.fn()}
      />
    );

    const select = screen.getByLabelText('Lọc ưu tiên');
    fireEvent.change(select, { target: { value: 'HIGH' } });
    expect(handleFilterChange).toHaveBeenCalledWith('HIGH');
  });
});

describe('Frontend: TaskRow Component', () => {
  it('Hiển thị đầy đủ thông tin: Tiêu đề, Badge ưu tiên, XP reward và hạn chót', () => {
    render(<TaskRow task={mockTasks[0]} />);

    expect(screen.getByText('Học React và TypeScript')).toBeInTheDocument();
    expect(screen.getByText(/\+30 XP/)).toBeInTheDocument();
    expect(screen.getByText(/Cao/)).toBeInTheDocument();
  });

  it('Áp dụng gạch ngang và trạng thái hoàn thành cho task COMPLETED', () => {
    const { container } = render(<TaskRow task={mockTasks[1]} />);

    expect(container.querySelector('.task-row.completed')).toBeInTheDocument();
    expect(container.querySelector('.check.done')).toBeInTheDocument();
    expect(screen.getByText(/\+20 XP/)).toBeInTheDocument();
  });
});
