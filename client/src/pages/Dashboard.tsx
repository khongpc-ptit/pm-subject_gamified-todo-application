import type { UserProfile } from '../types/auth.types';
import React, { useRef, useState, useCallback } from 'react';
import { DashboardPage } from './DashboardPage';
import { TaskFilters } from '../components/dashboard/TaskFilters';
import { Header } from '../components/Header';
import { Navigation } from '../components/layout/Navigation';
import { QuickTaskForm } from '../components/QuickTaskForm';
import { TaskList } from '../components/TaskList';
import { EditTaskModal } from '../components/EditTaskModal';
import { LevelUpModal } from '../components/gamification/LevelUpModal';
import type { FreezeStreakResponseData } from '../services/gamificationService';
import { useGamification } from '../context/GamificationContext';
import { BadgesPage } from './BadgesPage';
import { BadgeUnlockModal } from '../components/badges/BadgeUnlockModal';
import { useBadges } from '../hooks/useBadges';
import { ProfilePage } from './ProfilePage';
import { HabitsPage } from './HabitsPage';
import { useTasks } from '../hooks/useTasks';
import type { Task, UpdateTaskRequestDTO } from '../types/task.types';

interface DashboardProps {
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, onLogout, onUpdateUser }) => {
  const { totalXP, currentLevel, levelUpModal, triggerGamificationUpdate } = useGamification();
  const badgeShowcase = useBadges(currentUser?._id);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const [currentScreen, setCurrentScreen] = useState<'badges' | 'dashboard' | 'habits' | 'profile'>('dashboard');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [notificationRefreshKey, setNotificationRefreshKey] = useState(0);
  const [summaryRevision, setSummaryRevision] = useState(0);
  const refreshSummary = () => setSummaryRevision(value => value + 1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    tasks,
    allTasksCount,
    todoTasks,
    completedTasks,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
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
    refreshSummary();
    if (data.status === 'COMPLETED') setNotificationRefreshKey(key => key + 1);
    showToast('Đã lưu thay đổi');
    if (data.status === 'COMPLETED') void badgeShowcase.refresh();
  };

  const handleFreezeSuccess = (result: FreezeStreakResponseData) => {
    refreshSummary();
    if (currentUser) onUpdateUser?.({
      ...currentUser,
      streak_freeze_count: result.streak_freeze_count,
      current_streak: result.current_streak,
      streak_frozen_date: result.frozen_date ?? currentUser.streak_frozen_date
    });
  };

  const renderHabits = (compact = false) => (
    <HabitsPage
      compact={compact}
      currentUser={
        currentUser
          ? {
              ...currentUser,
              total_xp: currentUser.total_xp !== undefined ? currentUser.total_xp : totalXP,
              current_level: currentUser.current_level !== undefined ? currentUser.current_level : currentLevel
            }
          : null
      }
      onNavigate={(screen) => setCurrentScreen(screen)}
      onToast={showToast}
      onCheckInSuccess={(result) => {
        refreshSummary();
        void badgeShowcase.refresh(result.unlocked_badges?.map(badge => badge._id));
        triggerGamificationUpdate({
          total_xp: result.total_xp,
          current_level: result.current_level,
          level_up: result.level_up,
          xp_earned: result.xp_earned
        });
        setNotificationRefreshKey(key => key + 1);
        if (currentUser) {
          onUpdateUser?.({
            ...currentUser,
            total_xp: result.total_xp,
            current_level: result.current_level,
            last_active_date: result.habit.logs.at(-1)?.log_date ?? currentUser.last_active_date
          });
        }
      }}
      onFreezeSuccess={handleFreezeSuccess}
    />
  );

  const taskPanel = (
    <>
      <QuickTaskForm
        onTaskCreated={() => { void refetch(); refreshSummary(); }}
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
        filters={<TaskFilters value={filters} onChange={setFilters} onClear={clearFilters} />}
        onClearFilters={clearFilters}
        onToggleComplete={(updated) => {
          void badgeShowcase.refresh(updated?.unlocked_badges?.map(badge => badge._id));
          void refetch();
          refreshSummary();
          setNotificationRefreshKey(key => key + 1);
          if (updated?.total_xp !== undefined) {
            triggerGamificationUpdate({
              total_xp: updated.total_xp,
              current_level: updated.current_level,
              level_up: updated.level_up,
              xp_earned: updated.xp_earned,
              is_cap_reached: updated.is_cap_reached
            });
            if (currentUser) {
              onUpdateUser?.({
                ...currentUser,
                total_xp: updated.total_xp,
                current_level: updated.current_level ?? currentUser.current_level
              });
            }
            const earned = updated.xp_earned ?? 0;
            if (earned > 0) {
              showToast(`Hoàn thành công việc! +${earned} XP`);
            } else if (updated.is_cap_reached) {
              showToast('Hoàn thành công việc! Đã đạt trần tối đa 200 XP hôm nay');
            }
          }
        }}
        onRetry={refetch}
        onFocusCreate={() => quickInputRef.current?.focus()}
        onEdit={(task) => setEditingTask(task)}
      />
    </>
  );

  return (
    <div className={currentScreen === 'badges' ? 'shell badge-showcase-shell' : 'shell'}>
      {/* 1. Thanh điều hướng thích ứng (Desktop Sidebar + Mobile Bottom Nav & Drawer) [TECH-S4-05] */}
      <Navigation
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          if (screen === 'badges') void badgeShowcase.refresh();
          setCurrentScreen(screen as 'badges' | 'dashboard' | 'habits' | 'profile');
        }}
        onLogout={onLogout}
        userName={currentUser?.full_name || 'Minh Anh'}
        userEmail={currentUser?.email || 'minhanh@example.com'}
      />

      {/* 2. Khung nội dung chính */}
      <div id="frame">
        <main className="main">
          {/* Header Topbar */}
          <Header
            notifications={Boolean(currentUser)}
            notificationRefreshKey={notificationRefreshKey}
            xp={currentUser?.total_xp ?? totalXP}
            streak={currentUser?.current_streak ?? 6}
            freeze={currentUser?.streak_freeze_count ?? 1}
            level={currentUser?.current_level ?? currentLevel}
          />

          {/* Vùng nội dung trung tâm */}
          <div className="content">
            {currentScreen === 'badges' ? (
              <BadgesPage badges={badgeShowcase.badges} loading={badgeShowcase.loading}
                error={badgeShowcase.error} onRetry={badgeShowcase.refresh} />
            ) : currentScreen === 'profile' ? (
              <ProfilePage
                currentUser={
                  currentUser
                    ? {
                        ...currentUser,
                        total_xp: currentUser.total_xp !== undefined ? currentUser.total_xp : totalXP,
                        current_level: currentUser.current_level !== undefined ? currentUser.current_level : currentLevel
                      }
                    : {
                        _id: '1',
                        email: 'minhanh@example.com',
                        full_name: 'Minh Anh',
                        current_level: currentLevel,
                        total_xp: totalXP,
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
            ) : currentScreen === 'habits' ? renderHabits() : (
              <DashboardPage
                key={currentUser?._id ?? 'guest'}
                userId={currentUser?._id}
                revision={summaryRevision}
                habits={currentUser ? renderHabits(true) : undefined}
                streakProps={{ streakFreezeCount: currentUser?.streak_freeze_count, onToast: showToast, onFreezeSuccess: handleFreezeSuccess }}
                onOpenBadges={() => { void badgeShowcase.refresh(); setCurrentScreen('badges'); }}
                tasks={taskPanel}
              />
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

      {/* Modal Chúc mừng Thăng cấp độ [TECH-S2-07] */}
      <LevelUpModal />
      {badgeShowcase.unlocked && !levelUpModal?.isOpen && (
        <BadgeUnlockModal key={badgeShowcase.unlocked.id} badge={badgeShowcase.unlocked} onClose={badgeShowcase.acknowledge} />
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
