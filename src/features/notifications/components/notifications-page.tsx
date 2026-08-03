'use client';

import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { NotificationCard } from '@/components/ui/notification-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  markAllNotificationsAsReadMutation,
  markNotificationAsReadMutation
} from '../api/mutations';
import { notificationsQueryOptions } from '../api/queries';
import type { NotificationRecord } from '../api/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsPage() {
  const { data, error, isPending } = useQuery(notificationsQueryOptions());
  const markAsRead = useMutation(markNotificationAsReadMutation);
  const markAllAsRead = useMutation(markAllNotificationsAsReadMutation);
  const router = useRouter();
  const notifications = data?.items ?? [];
  const count = data?.unreadCount ?? 0;

  const unreadNotifications = notifications.filter((n) => n.status === 'unread');
  const readNotifications = notifications.filter((n) => n.status === 'read');

  const renderList = (items: NotificationRecord[]) => {
    if (items.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <Icons.notification className='text-muted-foreground/40 mb-3 h-10 w-10' />
          <p className='text-muted-foreground text-sm'>Không có thông báo</p>
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-2'>
        {items.map((notification) => (
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
    );
  };

  return (
    <PageContainer
      pageTitle='Thông báo'
      pageDescription='Xem và quản lý tất cả thông báo của bạn.'
      pageHeaderAction={
        count > 0 ? (
          <Button
            variant='outline'
            size='sm'
            disabled={markAllAsRead.isPending}
            onClick={() => markAllAsRead.mutate()}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        ) : undefined
      }
    >
      {isPending ? (
        <div className='flex flex-col gap-3'>
          <Skeleton className='h-10 w-72' />
          <Skeleton className='h-28 w-full' />
          <Skeleton className='h-28 w-full' />
        </div>
      ) : error ? (
        <p className='py-16 text-center text-sm text-destructive'>
          Không thể tải thông báo. Vui lòng thử lại.
        </p>
      ) : (
        <Tabs defaultValue='all'>
          <TabsList>
            <TabsTrigger value='all'>Tất cả ({notifications.length})</TabsTrigger>
            <TabsTrigger value='unread'>Chưa đọc ({unreadNotifications.length})</TabsTrigger>
            <TabsTrigger value='read'>Đã đọc ({readNotifications.length})</TabsTrigger>
          </TabsList>
          <TabsContent value='all' className='mt-4'>
            {renderList(notifications)}
          </TabsContent>
          <TabsContent value='unread' className='mt-4'>
            {renderList(unreadNotifications)}
          </TabsContent>
          <TabsContent value='read' className='mt-4'>
            {renderList(readNotifications)}
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  );
}
