import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
import type { NotificationStatus, NotificationAction } from '@/components/ui/notification-card';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actions?: NotificationAction[];
};

type NotificationState = {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'status'>) => void;
  unreadCount: () => number;
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Thành viên mới tham gia nhóm',
    body: 'Nguyễn An vừa tham gia Nhóm Alpha.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actions: [
      {
        id: 'view',
        label: 'Xem không gian nhóm',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '2',
    title: 'Checkpoint mới đã được mở',
    body: 'Checkpoint "Prototype tương tác" hiện đã sẵn sàng để cập nhật tiến độ.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actions: [
      {
        id: 'view-product',
        label: 'Xem checkpoint',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '3',
    title: 'Hạn nộp sắp tới',
    body: 'Checkpoint nhóm sẽ đến hạn trong 4 ngày nữa.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actions: [
      {
        id: 'billing',
        label: 'Xem thời hạn',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '4',
    title: 'Bạn được giao nhiệm vụ mới',
    body: 'Trưởng nhóm đã giao cho bạn hoàn thiện luồng đăng ký của prototype.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actions: [
      {
        id: 'open',
        label: 'Mở nhiệm vụ',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '5',
    title: 'Giảng viên đã xác nhận checkpoint',
    body: 'Checkpoint "Đề xuất ý tưởng nhóm" đã được xác nhận hoàn thành.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    actions: [
      {
        id: 'open-chat',
        label: 'Xem chi tiết',
        type: 'redirect',
        style: 'primary'
      }
    ]
  }
];

export const useNotificationStore = create<NotificationState>()(
  // To enable persistence across refreshes, uncomment the persist wrapper below:
  // persist(
  (set, get) => ({
    notifications: mockNotifications,

    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n
        )
      })),

    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          status: 'read' as const
        }))
      })),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),

    addNotification: (notification) =>
      set((state) => ({
        notifications: [{ ...notification, status: 'unread' as const }, ...state.notifications]
      })),

    unreadCount: () => get().notifications.filter((n) => n.status === 'unread').length
  })
  //   ,
  //   { name: 'notifications' }
  // )
);
