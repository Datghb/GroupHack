import { describe, expect, it } from 'vitest';
import { mapNotification, type NotificationRow } from './map-notification';

const baseRow: NotificationRow = {
  id: 'notification-id',
  title: 'Bài tập mới',
  body: 'Bạn có một bài tập mới.',
  action_url: '/student/classes/class-id/assignments/assignment-id',
  read_at: null,
  created_at: '2026-08-03T08:00:00.000Z'
};

describe('mapNotification', () => {
  it('maps a notification without read_at to unread', () => {
    expect(mapNotification(baseRow)).toEqual({
      id: 'notification-id',
      title: 'Bài tập mới',
      body: 'Bạn có một bài tập mới.',
      actionUrl: '/student/classes/class-id/assignments/assignment-id',
      status: 'unread',
      createdAt: '2026-08-03T08:00:00.000Z'
    });
  });

  it('maps a notification with read_at to read', () => {
    expect(mapNotification({ ...baseRow, read_at: '2026-08-03T09:00:00.000Z' }).status).toBe(
      'read'
    );
  });
});
