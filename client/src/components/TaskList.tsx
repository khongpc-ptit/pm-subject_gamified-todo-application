import React from 'react';
import type { CompleteTaskResponseData, Task } from '../types/task.types';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  allTasksCount: number;
  todoTasks: Task[];
  completedTasks: Task[];
  loading: boolean;
  error: string | null;
  filters?: React.ReactNode;
  onClearFilters?: () => void;
  priorityFilter?: string;
  onFilterChange?: (priority: string) => void;
  onRetry: () => void;
  onFocusCreate?: () => void;
  onToggleComplete?: (task: CompleteTaskResponseData) => void;
  onEdit?: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  allTasksCount,
  todoTasks,
  completedTasks,
  loading,
  error,
  filters,
  onClearFilters,
  priorityFilter,
  onFilterChange,
  onRetry,
  onFocusCreate,
  onToggleComplete,
  onEdit
}) => {
  return (
    <div>
      {/* Thanh công cụ lọc */}
      {filters ?? <div className="toolbar">
        <span className="screen-index">CÔNG VIỆC CỦA BẠN</span>
        <select
          id="priority-filter"
          aria-label="Lọc ưu tiên"
          value={priorityFilter}
          onChange={(e) => onFilterChange?.(e.target.value)}
        >
          <option value="ALL">Tất cả ưu tiên</option>
          <option value="HIGH">Ưu tiên cao</option>
          <option value="MEDIUM">Ưu tiên vừa</option>
          <option value="LOW">Ưu tiên thấp</option>
        </select>
      </div>}

      {/* 1. Trạng thái Đang tải dữ liệu (Loading Skeleton) */}
      {loading && (
        <section className="card" role="status" aria-busy="true">
          <h2>Đang tải dữ liệu…</h2>
          <div className="skeleton" aria-hidden="true" />
          <div className="skeleton" aria-hidden="true" />
          <div className="skeleton" aria-hidden="true" />
        </section>
      )}

      {/* 2. Trạng thái Lỗi truy xuất (Error State) */}
      {!loading && error && (
        <section className="empty" role="alert">
          <div className="empty-icon" aria-hidden="true">!</div>
          <h2>Chưa tải được dữ liệu</h2>
          <p>{error}</p>
          <button type="button" className="primary" onClick={onRetry}>
            Thử lại
          </button>
        </section>
      )}

      {/* 3. Trạng thái Danh sách trống ban đầu (Empty State) */}
      {!loading && !error && allTasksCount === 0 && (
        <section className="empty">
          <div className="empty-icon" aria-hidden="true">✓</div>
          <h2>Hành trình bắt đầu từ một việc nhỏ</h2>
          <p>Thêm công việc đầu tiên của bạn và nhận XP khi hoàn thành.</p>
          <button
            type="button"
            className="primary"
            onClick={onFocusCreate}
          >
            ＋ Tạo công việc đầu tiên
          </button>
        </section>
      )}

      {/* 4. Trạng thái Không có việc phù hợp với bộ lọc (Filter Empty State) */}
      {!loading && !error && allTasksCount > 0 && tasks.length === 0 && (
        <section className="empty">
          <h2>Không có việc phù hợp</h2>
          <p>Đổi bộ lọc để xem các công việc khác.</p>
          <button
            type="button"
            onClick={onClearFilters ?? (() => onFilterChange?.('ALL'))}
          >
            Xóa bộ lọc
          </button>
        </section>
      )}

      {/* 5. Trạng thái Hiển thị danh sách công việc (Normal List View) */}
      {!loading && !error && tasks.length > 0 && (
        <div>
          {/* Nhóm TODO */}
          <div className="section-line">
            <h2>TODO</h2>
            <span className="count">{todoTasks.length}</span>
          </div>

          {todoTasks.length > 0 ? (
            <div className="listbox">
              {todoTasks.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          ) : (
            <p className="helper">Bạn đã hoàn thành tất cả công việc trong nhóm này.</p>
          )}

          {/* Nhóm COMPLETED */}
          <div className="section-line">
            <h2>COMPLETED</h2>
            <span className="count">{completedTasks.length}</span>
          </div>

          {completedTasks.length > 0 ? (
            <div className="listbox">
              {completedTasks.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          ) : (
            <p className="helper">Công việc hoàn thành sẽ xuất hiện ở đây.</p>
          )}
        </div>
      )}
    </div>
  );
};
