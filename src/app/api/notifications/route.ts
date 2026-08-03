import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  mapNotification,
  type NotificationRow
} from '@/features/notifications/domain/map-notification';

export async function GET() {
  const { userId } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('notifications')
    .select('id,title,body,action_url,read_at,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = ((data ?? []) as NotificationRow[]).map(mapNotification);
  return NextResponse.json({
    data: {
      items,
      unreadCount: items.filter((item) => item.status === 'unread').length
    }
  });
}
