import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, TaskPriority, ListTasksQueryDTO } from '../types/task.types';
import { taskService, INITIAL_MOCK_TASKS } from '../services/task.service';

export type DemoState = 'default' | 'empty' | 'loading' | 'error';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [demoState, setDemoState] = useState<DemoState>('default');

  const fetchTasks = useCallback(async (filter?: ListTasksQueryDTO) => {
    setLoading(true);
    setError(null);

    // Xử lý demo state được chọn chủ động từ thanh review-strip
    if (demoState === 'empty') {
      setTasks([]);
      setLoading(false);
      return;
    }

    if (demoState === 'loading') {
      setLoading(true);
      return;
    }

    if (demoState === 'error') {
      setLoading(false);
      setError('Kết nối bị gián đoạn. Hãy thử lại để tiếp tục.');
      return;
    }

    try {
      const data = await taskService.getTasks(filter);
      setTasks(data.tasks);
    } catch (err: any) {
      // Khi Backend chưa bật, dùng mock data để giữ trải nghiệm kiểm thử wireframe
      console.warn('[useTasks] Không thể kết nối Backend, đang hiển thị dữ liệu demo');
      setTasks(INITIAL_MOCK_TASKS);
    } finally {
      setLoading(false);
    }
  }, [demoState]);

  useEffect(() => {
    const filterParam: ListTasksQueryDTO = {};
    if (priorityFilter !== 'ALL') {
      filterParam.priority = priorityFilter as TaskPriority;
    }
    fetchTasks(filterParam);
  }, [fetchTasks, priorityFilter]);

  // Lọc nhiệm vụ theo priorityFilter phía client
  const filteredTasks = useMemo(() => {
    if (priorityFilter === 'ALL') return tasks;
    return tasks.filter((t) => t.priority === priorityFilter);
  }, [tasks, priorityFilter]);

  // Phân chia nhóm TODO và COMPLETED
  const todoTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status !== 'COMPLETED');
  }, [filteredTasks]);

  const completedTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === 'COMPLETED');
  }, [filteredTasks]);

  return {
    tasks: filteredTasks,
    allTasksCount: tasks.length,
    todoTasks,
    completedTasks,
    loading,
    error,
    priorityFilter,
    setPriorityFilter,
    demoState,
    setDemoState,
    refetch: () => fetchTasks(priorityFilter !== 'ALL' ? { priority: priorityFilter as TaskPriority } : {})
  };
}
