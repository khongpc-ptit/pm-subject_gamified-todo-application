import type { UserProfile } from '../types/auth.types';
import React, { useRef, useState, useCallback } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { QuickTaskForm } from '../components/QuickTaskForm';
import { TaskList } from '../components/TaskList';
import { EditTaskModal } from '../components/EditTaskModal';
import { ProfilePage } from './ProfilePage';
import { HabitsPage } from './HabitsPage';
import { useTasks, type DemoState } from '../hooks/useTasks';
import type { Task, UpdateTaskRequestDTO } from '../types/task.types';

interface DashboardProps {
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, onLogout, onUpdateUser }) => {
  const quickInputRef = useRef<HTMLInputElement>(null);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'habits' | 'profile'>('dashboard');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    tasks,
    allTasksCount,
    todoTasks,
    completedTasks,
    loading,
    error,
    priorityFilter,
    setPriorityFilter,
    demoState,
    setDemoState,
    updateTask,
    refetch
  } = useTasks();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const handleSaveTask = async (id: string, data: UpdateTaskRequestDTO) => {
    await updateTask(id, data);
    showToast('Đã lưu thay đổi');
  };

  return (
    <div className="shell">
      {/* 1. Thanh điều hướng Sidebar cố định bên trái */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen as 'dashboard' | 'habits' | 'profile')}
        onLogout={onLogout}
        userName={currentUser?.full_name || 'Minh Anh'}
        userEmail={currentUser?.email || 'minhanh@example.com'}
      />

      {/* 2. Khung nội dung chính */}
      <div id="frame">
        <main className="main">
          {/* Header Topbar */}
          <Header
            xp={currentUser?.total_xp ?? 380}
            streak={currentUser?.current_streak ?? 6}
            freeze={currentUser?.streak_freeze_count ?? 1}
            level={currentUser?.current_level ?? 1}
          />

          {/* Vùng nội dung trung tâm */}
          <div className="content">
            {currentScreen === 'profile' ? (
              <ProfilePage
                currentUser={
                  currentUser || {
                    _id: '1',
                    email: 'minhanh@example.com',
                    full_name: 'Minh Anh',
                    current_level: 1,
                    total_xp: 380,
                    current_streak: 6,
                    last_active_date: null,
                    streak_freeze_count: 1,
                    created_at: new Date().toISOString()
                  }
                }
                onUpdateUser={(updated) => {
                  onUpdateUser?.(updated);
                  showToast('Cập nhật hồ sơ thành công');
                }}
                onNavigateBack={() => setCurrentScreen('dashboard')}
              />
            ) : currentScreen === 'habits' ? (
              <HabitsPage
                currentUser={currentUser}
                onNavigate={(screen) => setCurrentScreen(screen)}
                onToast={showToast}
              />
            ) : (
              <>
                {/* Tiêu đề trang */}
                <div className="page-title">
                  <div>
                    <div className="eyebrow">01 / YOUR DAILY QUEST</div>
                    <h1>Hôm nay, tiến thêm một bước.</h1>
                    <p>Tập trung vào điều quan trọng. Mỗi việc nhỏ đều có giá trị.</p>
                  </div>
                  <span className="date-tag">Thứ Bảy, 15 tháng 11 · Sprint 1</span>
                </div>

                {/* Bố cục Grid 2 cột */}
                <div className="grid">
                  {/* Cột trái: Quản lý công việc */}
                  <div>
                    {/* Form Tạo nhanh công việc */}
                    <QuickTaskForm
                      onTaskCreated={refetch}
                      inputRef={quickInputRef}
                    />

                    {/* [US-S1-02] Danh sách công việc với các trạng thái */}
                    <TaskList
                      tasks={tasks}
                      allTasksCount={allTasksCount}
                      todoTasks={todoTasks}
                      completedTasks={completedTasks}
                      loading={loading}
                      error={error}
                      priorityFilter={priorityFilter}
                      onFilterChange={setPriorityFilter}
                      onToggleComplete={refetch}
                      onRetry={refetch}
                      onFocusCreate={() => quickInputRef.current?.focus()}
                      onEdit={(task) => setEditingTask(task)}
                    />
                  </div>

                  {/* Cột phải: Thống kê Gamification */}
                  <aside>
                    {/* Khối Nhịp độ tuần này */}
                    <section className="card flat">
                      <div className="eyebrow">NHỊP ĐỘ TUẦN NÀY</div>
                      <h2>Đều đặn hơn mỗi ngày.</h2>
                      <div className="week">
                        <div className="day">T2<i className="on">✓</i></div>
                        <div className="day">T3<i className="on">✓</i></div>
                        <div className="day">T4<i className="on">✓</i></div>
                        <div className="day">T5<i className="on">✓</i></div>
                        <div className="day">T6<i className="on">✓</i></div>
                        <div className="day">T7<i className="today">·</i></div>
                        <div className="day">CN<i>–</i></div>
                      </div>
                      <p className="helper">Hoàn thành ít nhất 1 task hoặc check-in để duy trì chuỗi ngày.</p>
                    </section>

                    {/* Khối XP Hôm nay */}
                    <section className="card">
                      <div className="eyebrow">XP HÔM NAY</div>
                      <div className="metric">
                        55
                        <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--muted)' }}>
                          {' / 200 XP'}
                        </span>
                      </div>
                      <div className="progress">
                        <span style={{ width: `${(55 / 200) * 100}%` }} />
                      </div>
                      <p className="helper">
                        Nhận 10 / 20 / 30 XP theo ưu tiên. Check-in thói quen nhận 15 XP.
                      </p>
                    </section>

                    {/* Khối Dấu mốc tiếp theo */}
                    <section className="card">
                      <div className="eyebrow">DẤU MỐC TIẾP THEO</div>
                      <h3>7 ngày bền bỉ</h3>
                      <p>Thêm một ngày đều đặn để chạm đến huy hiệu chuỗi 7 ngày.</p>
                      <button
                        type="button"
                        className="small"
                        onClick={() => setCurrentScreen('profile')}
                      >
                        Xem bộ sưu tập ↗
                      </button>
                    </section>
                  </aside>
                </div>

                {/* Chân trang */}
                <footer className="footer">
                  <span>Questline PC-GTD-01 · Sprint 1 MVP</span>
                  <span>Gamified To-Do Application</span>
                </footer>

                {/* Thanh điều khiển QA / Review: Chuyển đổi trạng thái giao diện trực quan */}
                <div className="review-strip" role="region" aria-label="Bộ điều khiển QA trạng thái giao diện">
                  <strong>BỘ ĐIỀU KHIỂN DEMO / QA:</strong>
                  <label htmlFor="state-select" style={{ margin: 0, fontWeight: 500 }}>
                    Trạng thái UI:
                  </label>
                  <select
                    id="state-select"
                    aria-label="Trạng thái giao diện kiểm thử"
                    value={demoState}
                    onChange={(e) => setDemoState(e.target.value as DemoState)}
                  >
                    <option value="default">Có dữ liệu (Default)</option>
                    <option value="empty">Danh sách trống (Empty State)</option>
                    <option value="loading">Đang tải (Loading Skeleton)</option>
                    <option value="error">Lỗi kết nối (Error Alert)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal Chỉnh sửa công việc [US-S1-03 / TECH-S1-04] */}
      {editingTask && (
        <EditTaskModal
          key={editingTask._id}
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
        />
      )}

      {/* Thông báo Toast phản hồi thao tác */}
      {toastMessage && (
        <div className="toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
