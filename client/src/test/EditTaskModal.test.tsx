import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { EditTaskModal } from '../components/EditTaskModal';
import type { Task } from '../types/task.types';

const sampleTask: Task = {
  _id: 'task-12345',
  user_id: 'user-001',
  title: 'Nộp báo cáo kiến trúc hệ thống',
  description: 'Kiểm tra lại Swagger trước khi nộp',
  priority: 'MEDIUM',
  status: 'TODO',
  due_date: '2026-11-10T17:00:00.000Z',
  xp_reward: 20,
  completed_at: null,
  created_at: '2026-11-05T15:00:00.000Z'
};

describe('Frontend: [US-S1-03 / TECH-S1-04] EditTaskModal Component', () => {
  it('1. Không render modal khi isOpen = false hoặc task = null', () => {
    const { container: c1 } = render(
      <EditTaskModal
        task={sampleTask}
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <EditTaskModal
        task={null}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('2. Điền sẵn thông tin hiện tại của task vào biểu mẫu (Pre-fill Data)', () => {
    render(
      <EditTaskModal
        task={sampleTask}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/Tiêu đề/i) as HTMLInputElement;
    const descInput = screen.getByLabelText(/Mô tả/i) as HTMLTextAreaElement;
    const prioritySelect = screen.getByLabelText(/Ưu tiên/i) as HTMLSelectElement;
    const dueInput = screen.getByLabelText(/Hạn chót/i) as HTMLInputElement;
    const statusSelect = screen.getByLabelText(/Trạng thái/i) as HTMLSelectElement;

    expect(titleInput.value).toBe('Nộp báo cáo kiến trúc hệ thống');
    expect(descInput.value).toBe('Kiểm tra lại Swagger trước khi nộp');
    expect(prioritySelect.value).toBe('MEDIUM');
    expect(dueInput.value).toMatch(/^2026-11-\d{2}$/);
    expect(statusSelect.value).toBe('TODO');
  });

  it('3. Validate lỗi khi tiêu đề bị để trống và chặn submit', async () => {
    const handleSave = vi.fn();
    render(
      <EditTaskModal
        task={sampleTask}
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    const titleInput = screen.getByLabelText(/Tiêu đề/i);
    fireEvent.change(titleInput, { target: { value: '   ' } });

    const submitBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent('Vui lòng nhập tiêu đề.');
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('4. Validate lỗi khi tiêu đề vượt quá 200 ký tự', async () => {
    const handleSave = vi.fn();
    render(
      <EditTaskModal
        task={sampleTask}
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    const titleInput = screen.getByLabelText(/Tiêu đề/i);
    fireEvent.change(titleInput, { target: { value: 'A'.repeat(205) } });

    const submitBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tiêu đề công việc không được vượt quá 200 ký tự.'
    );
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('5. Gửi dữ liệu cập nhật hợp lệ khi submit form thành công', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <EditTaskModal
        task={sampleTask}
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    // Thay đổi tiêu đề
    const titleInput = screen.getByLabelText(/Tiêu đề/i);
    fireEvent.change(titleInput, {
      target: { value: 'Nộp báo cáo kiến trúc hệ thống (Đã chỉnh sửa)' }
    });

    // Thay đổi priority từ MEDIUM sang HIGH
    const prioritySelect = screen.getByLabelText(/Ưu tiên/i);
    fireEvent.change(prioritySelect, { target: { value: 'HIGH' } });

    // Thay đổi trạng thái sang IN_PROGRESS
    const statusSelect = screen.getByLabelText(/Trạng thái/i);
    fireEvent.change(statusSelect, { target: { value: 'IN_PROGRESS' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith('task-12345', {
        title: 'Nộp báo cáo kiến trúc hệ thống (Đã chỉnh sửa)',
        description: 'Kiểm tra lại Swagger trước khi nộp',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        due_date: expect.any(String)
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('6. Hỗ trợ xóa ngày hạn chót (clear due_date) và gửi null', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <EditTaskModal
        task={sampleTask}
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    const dueInput = screen.getByLabelText(/Hạn chót/i);
    fireEvent.change(dueInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        'task-12345',
        expect.objectContaining({ due_date: null })
      );
    });
  });

  it('7. Gọi onClose khi click nút Hủy hoặc nút Đóng ✕', () => {
    const handleClose = vi.fn();
    render(
      <EditTaskModal
        task={sampleTask}
        isOpen={true}
        onClose={handleClose}
        onSave={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Hủy/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole('button', { name: /Đóng/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('8. Đóng modal khi nhấn phím Escape', () => {
    const handleClose = vi.fn();
    render(
      <EditTaskModal
        task={sampleTask}
        isOpen={true}
        onClose={handleClose}
        onSave={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('9. Đóng modal khi click ra ngoài backdrop (overlay)', () => {
    const handleClose = vi.fn();
    render(
      <EditTaskModal
        task={sampleTask}
        isOpen={true}
        onClose={handleClose}
        onSave={vi.fn()}
      />
    );

    const overlay = screen.getByTestId('edit-task-overlay');
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
