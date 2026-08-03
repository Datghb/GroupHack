import { queryOptions } from '@tanstack/react-query';
import { getNotifications } from './service';

export const notificationKeys = {
  all: ['notifications'] as const
};

export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: notificationKeys.all,
    queryFn: getNotifications,
    refetchInterval: 30_000
  });
