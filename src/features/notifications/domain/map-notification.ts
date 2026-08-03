import type { NotificationRecord } from '../api/types';

export interface NotificationRow {
  id: string;
  title: string;
  body: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export function mapNotification(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    actionUrl: row.action_url,
    status: row.read_at ? 'read' : 'unread',
    createdAt: row.created_at
  };
}
