import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  assignmentId: z.string().uuid(),
  criteria: z
    .array(
      z.object({
        title: z.string().trim().min(2).max(120),
        description: z.string().trim().max(500)
      })
    )
    .min(1)
    .max(20)
});

export async function POST(request: Request) {
  const { userId, role } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'TEACHER')
    return NextResponse.json({ error: 'Chỉ giảng viên được tạo tiêu chí.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Thông tin tiêu chí không hợp lệ.' }, { status: 400 });
  const db = getSupabaseAdmin();
  const { data: assignment } = await db
    .from('assignments')
    .select('id,classrooms!inner(teacher_id)')
    .eq('id', parsed.data.assignmentId)
    .eq('classrooms.teacher_id', userId)
    .maybeSingle();
  if (!assignment)
    return NextResponse.json({ error: 'Bạn không quản lý bài tập này.' }, { status: 403 });
  const { count } = await db
    .from('assignment_review_criteria')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', parsed.data.assignmentId);
  const { data, error } = await db
    .from('assignment_review_criteria')
    .insert(
      parsed.data.criteria.map((criterion, index) => ({
        assignment_id: parsed.data.assignmentId,
        title: criterion.title,
        description: criterion.description,
        position: (count ?? 0) + index,
        created_by: userId
      }))
    )
    .select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
