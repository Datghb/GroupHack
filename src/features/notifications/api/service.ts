import type { NotificationsResponse } from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers }
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Không thể xử lý yêu cầu.');
  return body.data;
}

export const getNotifications = () => request<NotificationsResponse>('/api/notifications');

export const markNotificationAsRead = (id: string) =>
  request<{ updated: true }>(`/api/notifications/${id}`, { method: 'PATCH' });

export const markAllNotificationsAsRead = () =>
  request<{ updated: true }>('/api/notifications/read-all', { method: 'PATCH' });
