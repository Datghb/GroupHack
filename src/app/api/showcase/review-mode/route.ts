import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  assignmentId: z.string().uuid(),
  reviewMode: z.enum(['TEAM', 'INDIVIDUAL'])
});

export async function PATCH(request: Request) {
  const { userId, role } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'TEACHER')
    return NextResponse.json({ error: 'Chỉ giảng viên được đổi chế độ chấm.' }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Chế độ đánh giá không hợp lệ.' }, { status: 400 });

  const db = getSupabaseAdmin();
  const { error } = await db.rpc('set_assignment_review_mode', {
    p_assignment_id: parsed.data.assignmentId,
    p_teacher_id: userId,
    p_review_mode: parsed.data.reviewMode
  });
  if (error)
    return NextResponse.json(
      { error: 'Không thể đổi chế độ chấm cho bài tập này.' },
      { status: error.message.includes('not managed') ? 403 : 500 }
    );

  return NextResponse.json({ data: { reviewMode: parsed.data.reviewMode } });
}
