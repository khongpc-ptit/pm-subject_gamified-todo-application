import { apiClient } from './api';
import type { ApiResponse } from '../types/task.types';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ACHIEVEMENT' | 'REMINDER' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
}

export interface NotificationInbox {
  notifications: Notification[];
  unread_count: number;
  total: number;
}

export const notificationService = {
  async list(signal?: AbortSignal): Promise<NotificationInbox> {
    const { data } = await apiClient.get<ApiResponse<NotificationInbox>>('/notifications', { signal });
    if (!data.success || !Array.isArray(data.data?.notifications)) throw new Error('Không thể tải thông báo');
    return data.data;
  },

  async markRead(id: string): Promise<{ unread_count: number }> {
    const { data } = await apiClient.patch<ApiResponse<{ unread_count: number }>>(
      '/notifications/' + encodeURIComponent(id) + '/read'
    );
    if (!data.success || !data.data) throw new Error('Không thể cập nhật thông báo');
    return data.data;
  },

  async markAllRead(): Promise<{ unread_count: number }> {
    const { data } = await apiClient.patch<ApiResponse<{ unread_count: number }>>('/notifications/read-all');
    if (!data.success || !data.data) throw new Error('Không thể cập nhật thông báo');
    return data.data;
  }
};
