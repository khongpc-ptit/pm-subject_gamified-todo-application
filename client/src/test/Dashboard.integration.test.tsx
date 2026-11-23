import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';
import { taskService } from '../services/task.service';
import type { Task } from '../types/task.types';

vi.mock('../services/task.service', () => ({
  taskService: { getTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), completeTask: vi.fn() }
}));

const task: Task = {
  _id: 'task-1', user_id: 'owner', title: 'Sprint review', description: '',
  priority: 'HIGH', due_date: null, status: 'TODO', xp_reward: 30,
  completed_at: null, created_at: '2026-11-23T00:00:00.000Z'
};

describe('Dashboard task workflows', () => {
  beforeEach(() => vi.resetAllMocks());

  it('shows loading, recovers from a list error and distinguishes empty states', async () => {
    let failList!: (error: Error) => void;
    vi.mocked(taskService.getTasks).mockImplementationOnce(() =>
      new Promise((_resolve, reject) => { failList = reject; })
    ).mockResolvedValueOnce({ tasks: [], total: 0 }).mockResolvedValueOnce({ tasks: [task], total: 1 });
    const firstLoad = render(<Dashboard />);
    expect(screen.getByRole('status', { busy: true })).toBeInTheDocument();
    failList(new Error('Offline'));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Hành trình bắt đầu từ một việc nhỏ')).toBeInTheDocument();

    firstLoad.unmount();
    render(<Dashboard />);
    expect(await screen.findByText(task.title)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Lọc ưu tiên'), { target: { value: 'LOW' } });
    expect(screen.getByText('Không có việc phù hợp')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(screen.getByText(task.title)).toBeInTheDocument();
  });

  it('reports failed creation and sends one request per pending submission', async () => {
    vi.mocked(taskService.getTasks).mockResolvedValueOnce({ tasks: [], total: 0 })
      .mockResolvedValueOnce({ tasks: [task], total: 1 });
    let finishCreate!: (value: Task) => void;
    vi.mocked(taskService.createTask).mockRejectedValueOnce(new Error('Create failed')).mockImplementation(() =>
      new Promise(resolve => { finishCreate = resolve; })
    );
    render(<Dashboard />);
    await screen.findByText('Hành trình bắt đầu từ một việc nhỏ');
    const form = screen.getByLabelText('Tên công việc').closest('form')!;
    fireEvent.submit(form);
    expect(await within(form).findByRole('alert')).toHaveTextContent('Vui lòng nhập');
    expect(taskService.createTask).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Tên công việc'), { target: { value: task.title } });
    fireEvent.submit(form);
    expect(await within(form).findByRole('alert')).toHaveTextContent('Create failed');
    expect(within(form).queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('T?n c?ng vi?c')).toHaveValue(task.title);
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(taskService.createTask).toHaveBeenCalledTimes(2);
    finishCreate(task);
    expect(await screen.findByText(task.title)).toBeInTheDocument();
    expect(within(form).getByRole('status')).toHaveTextContent('Tạo công việc thành công');
  });

  it('keeps the edit form open and the saved row unchanged when the API rejects the edit', async () => {
    vi.mocked(taskService.getTasks).mockResolvedValue({ tasks: [task], total: 1 });
    vi.mocked(taskService.updateTask).mockRejectedValueOnce(new Error('Edit failed'));
    render(<Dashboard />);
    fireEvent.click(await screen.findByRole('button', { name: 'Sửa ' + task.title }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Tiêu đề'), { target: { value: 'Unsaved' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Edit failed');
    expect(screen.getByText(task.title)).toBeInTheDocument();
    expect(screen.queryByText('Đã lưu thay đổi')).not.toBeInTheDocument();
  });

  it('keeps a task incomplete after a failed request and moves it after retry', async () => {
    const completed: Task = { ...task, status: 'COMPLETED', completed_at: task.created_at };
    vi.mocked(taskService.getTasks).mockResolvedValueOnce({ tasks: [task], total: 1 })
      .mockResolvedValueOnce({ tasks: [completed], total: 1 });
    vi.mocked(taskService.completeTask).mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(completed);
    render(<Dashboard />);
    const button = await screen.findByRole('button', { name: 'Hoàn thành: ' + task.title });
    fireEvent.click(button);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    expect(await screen.findByRole('button', { name: 'Đã hoàn thành: ' + task.title })).toBeDisabled();
  });
});
