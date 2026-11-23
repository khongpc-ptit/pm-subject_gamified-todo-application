import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, TaskPriority, ListTasksQueryDTO, UpdateTaskRequestDTO } from '../types/task.types';
import { taskService } from '../services/task.service';

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
      setError(err.response?.data?.error?.message || 'Không thể tải danh sách công việc');
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

  const updateTask = useCallback(
    async (id: string, updateData: UpdateTaskRequestDTO): Promise<Task> => {
      try {
        const updated = await taskService.updateTask(id, updateData);
        setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
        return updated;
      } catch (err: any) {
        // Fallback demo state nếu backend offline
        console.warn('[useTasks] Cập nhật task qua mock fallback');
        const xpMap: Record<string, number> = { LOW: 10, MEDIUM: 20, HIGH: 30 };
        let updatedMock: Task | null = null;
        setTasks((prev) =>
          prev.map((t) => {
            if (t._id === id) {
              const newPriority = updateData.priority || t.priority;
              updatedMock = {
                ...t,
                title: updateData.title !== undefined ? updateData.title : t.title,
                description:
                  updateData.description !== undefined
                    ? updateData.description
                    : t.description,
                priority: newPriority,
                status: updateData.status !== undefined ? updateData.status : t.status,
                due_date:
                  updateData.due_date !== undefined ? updateData.due_date : t.due_date,
                xp_reward: xpMap[newPriority] || t.xp_reward,
                completed_at:
                  updateData.status === 'COMPLETED'
                    ? t.completed_at || new Date().toISOString()
                    : updateData.status
                    ? null
                    : t.completed_at
              };
              return updatedMock;
            }
            return t;
          })
        );
        if (updatedMock) return updatedMock;
        throw err;
      }
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
    refetch: () => fetchTasks(priorityFilter !== 'ALL' ? { priority: priorityFilter as TaskPriority } : {})
  };
}
