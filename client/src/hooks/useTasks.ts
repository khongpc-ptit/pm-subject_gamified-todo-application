import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, UpdateTaskRequestDTO } from '../types/task.types';
import { DEFAULT_TASK_FILTERS, type TaskFilterValues } from '../components/dashboard/TaskFilters';
import { taskService } from '../services/task.service';

const vietnamDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
});

export type DemoState = 'default' | 'empty' | 'loading' | 'error';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilterValues>(DEFAULT_TASK_FILTERS);
  const [keyword, setKeyword] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(filters.search.trim().toLocaleLowerCase('vi')), 300);
    return () => window.clearTimeout(timer);
  }, [filters.search]);
  const clearFilters = () => {
    setFilters(DEFAULT_TASK_FILTERS);
    setKeyword('');
  };
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

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (keyword && !task.title.toLocaleLowerCase('vi').includes(keyword)) return false;
    if (filters.status !== 'ALL' && task.status !== filters.status) return false;
    if (filters.priority !== 'ALL' && task.priority !== filters.priority) return false;
    if (!filters.from && !filters.to) return true;
    if (!task.due_date) return false;
    const date = vietnamDate.format(new Date(task.due_date));
    return (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to);
  }), [tasks, keyword, filters.status, filters.priority, filters.from, filters.to]);

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
    filters,
    setFilters,
    clearFilters,
    demoState,
    setDemoState,
    updateTask,
    refetch: fetchTasks
  };
}
