import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({ fullName: z.string().trim().min(2).max(100) });

export async function PATCH(request: Request) {
  const { userId } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Họ tên cần từ 2 đến 100 ký tự.' }, { status: 400 });
  const db = getSupabaseAdmin();
  const [{ error: profileError }, { error: authError }] = await Promise.all([
    db.from('profiles').update({ full_name: parsed.data.fullName }).eq('id', userId),
    db.auth.admin.updateUserById(userId, { user_metadata: { full_name: parsed.data.fullName } })
  ]);
  const error = profileError ?? authError;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { fullName: parsed.data.fullName } });
}
