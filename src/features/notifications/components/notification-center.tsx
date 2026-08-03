'use client';

import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NotificationCard } from '@/components/ui/notification-card';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  markAllNotificationsAsReadMutation,
  markNotificationAsReadMutation
} from '../api/mutations';
import { notificationsQueryOptions } from '../api/queries';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_VISIBLE = 5;

export function NotificationCenter() {
  const { data, error, isPending } = useQuery(notificationsQueryOptions());
  const markAsRead = useMutation(markNotificationAsReadMutation);
  const markAllAsRead = useMutation(markAllNotificationsAsReadMutation);
  const { user } = useCurrentUser();
  const router = useRouter();
  const notifications = data?.items ?? [];
  const count = data?.unreadCount ?? 0;
  const visibleNotifications = notifications.slice(0, MAX_VISIBLE);

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='ghost' size='icon' className='relative h-8 w-8' />}>
        <Icons.notification className='h-4 w-4' />
        {count > 0 && (
          <span className='bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium'>
            {count > 9 ? '9+' : count}
          </span>
        )}
        <span className='sr-only'>Thông báo</span>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[calc(100vw-2rem)] p-0 sm:w-[380px]' sideOffset={8}>
        <div className='flex items-center justify-between px-4 pt-3'>
          <Link
            href={user?.role === 'TEACHER' ? '/teacher/notifications' : '/student/notifications'}
            className='group flex items-center gap-1'
          >
            <h4 className='text-sm font-semibold group-hover:underline'>Thông báo</h4>
            <Icons.chevronRight className='text-muted-foreground h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
          </Link>
          <div className='flex items-center gap-2'>
            {count > 0 && (
              <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs'>
                {count} mới
              </span>
            )}
            {count > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground h-auto px-2 py-1 text-xs'
                disabled={markAllAsRead.isPending}
                onClick={() => markAllAsRead.mutate()}
              >
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className='h-[400px]'>
          {isPending ? (
            <div className='flex flex-col gap-2 p-3'>
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-20 w-full' />
            </div>
          ) : error ? (
            <p className='p-6 text-center text-sm text-destructive'>
              Không thể tải thông báo. Vui lòng thử lại.
            </p>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Icons.notification className='text-muted-foreground/40 mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>Chưa có thông báo</p>
            </div>
          ) : (
            <div className='flex flex-col gap-1 p-2'>
              {visibleNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  id={notification.id}
                  title={notification.title}
                  body={notification.body}
                  status={notification.status}
                  createdAt={notification.createdAt}
                  actions={
                    notification.actionUrl
                      ? [{ id: 'open', label: 'Xem chi tiết', type: 'redirect' }]
                      : []
                  }
                  onMarkAsRead={(id) => markAsRead.mutate(id)}
                  onAction={(notificationId) => {
                    if (notification.actionUrl) {
                      markAsRead.mutate(notificationId);
                      router.push(notification.actionUrl);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
