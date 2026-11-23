import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, UpdateTaskRequestDTO } from '../types/task.types';
import { taskService } from '../services/task.service';

export type DemoState = 'default' | 'empty' | 'loading' | 'error';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [demoState, setDemoState] = useState<DemoState>('default');

  const fetchTasks = useCallback(async () => {
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
      const data = await taskService.getTasks();
      setTasks(data.tasks);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  }, [demoState]);

  useEffect(() => { void fetchTasks(); }, [fetchTasks]);

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

  const updateTask = useCallback(
    async (id: string, updateData: UpdateTaskRequestDTO): Promise<Task> => {
      const updated = await taskService.updateTask(id, updateData);
      setTasks((prev) => prev.map((task) => task._id === id ? updated : task));
      return updated;
    },
    []
  );

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
    updateTask,
    refetch: fetchTasks
  };
}
