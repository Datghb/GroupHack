import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ criterionId: string }> }
) {
  const [{ userId, role }, { criterionId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'TEACHER')
    return NextResponse.json({ error: 'Chỉ giảng viên được xóa tiêu chí.' }, { status: 403 });
  const db = getSupabaseAdmin();
  const { data: criterion } = await db
    .from('assignment_review_criteria')
    .select('id,assignments!inner(classrooms!inner(teacher_id))')
    .eq('id', criterionId)
    .eq('assignments.classrooms.teacher_id', userId)
    .maybeSingle();
  if (!criterion)
    return NextResponse.json({ error: 'Bạn không quản lý tiêu chí này.' }, { status: 403 });
  const { count: scoreCount } = await db
    .from('product_review_scores')
    .select('id', { count: 'exact', head: true })
    .eq('criterion_id', criterionId);
  if (scoreCount)
    return NextResponse.json(
      { error: 'Không thể xóa tiêu chí đã có nhóm sử dụng để đánh giá.' },
      { status: 409 }
    );
  const { error } = await db.from('assignment_review_criteria').delete().eq('id', criterionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { deleted: true } });
}
