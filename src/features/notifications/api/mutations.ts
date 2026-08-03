import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { markAllNotificationsAsRead, markNotificationAsRead } from './service';
import { notificationKeys } from './queries';

const invalidateNotifications = () =>
  getQueryClient().invalidateQueries({ queryKey: notificationKeys.all });

export const markNotificationAsReadMutation = mutationOptions({
  mutationFn: markNotificationAsRead,
  onSuccess: invalidateNotifications
});

export const markAllNotificationsAsReadMutation = mutationOptions({
  mutationFn: markAllNotificationsAsRead,
  onSuccess: invalidateNotifications
});
