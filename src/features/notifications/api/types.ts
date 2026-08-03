export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  status: 'unread' | 'read';
  createdAt: string;
  actionUrl: string | null;
}

export interface NotificationsResponse {
  items: NotificationRecord[];
  unreadCount: number;
}
