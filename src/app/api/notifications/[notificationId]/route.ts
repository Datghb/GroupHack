import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const paramsSchema = z.object({ notificationId: z.string().uuid() });

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const [{ userId }, values] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const parsed = paramsSchema.safeParse(values);
  if (!parsed.success)
    return NextResponse.json({ error: 'Mã thông báo không hợp lệ.' }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', parsed.data.notificationId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Không tìm thấy thông báo.' }, { status: 404 });
  return NextResponse.json({ data: { updated: true } });
}
