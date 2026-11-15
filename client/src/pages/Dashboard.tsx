import React, { useRef } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { QuickTaskForm } from '../components/QuickTaskForm';
import { TaskList } from '../components/TaskList';
import { useTasks, type DemoState } from '../hooks/useTasks';

export const Dashboard: React.FC = () => {
  const quickInputRef = useRef<HTMLInputElement>(null);

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
    refetch
  } = useTasks();

  return (
    <div className="shell">
      {/* 1. Thanh điều hướng Sidebar cố định bên trái */}
      <Sidebar
        currentScreen="dashboard"
        userName="Minh Anh"
        userEmail="minhanh@example.com"
      />

      {/* 2. Khung nội dung chính */}
      <div id="frame">
        <main className="main">
          {/* Header Topbar */}
          <Header
            xp={380}
            streak={6}
            freeze={1}
            level={1}
          />

          {/* Vùng nội dung trung tâm */}
          <div className="content">
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
                  onRetry={refetch}
                  onFocusCreate={() => quickInputRef.current?.focus()}
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
                  <button type="button" className="small">
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
          </div>
        </main>
      </div>
    </div>
  );
};
