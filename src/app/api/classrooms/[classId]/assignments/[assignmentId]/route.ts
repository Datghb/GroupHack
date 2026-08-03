import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string; assignmentId: string }> }
) {
  const [{ userId }, { classId, assignmentId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const db = getSupabaseAdmin();
  const { data: assignment } = await db
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .eq('classroom_id', classId)
    .maybeSingle();
  if (!assignment) return NextResponse.json({ error: 'Không tìm thấy bài tập.' }, { status: 404 });
  const { data: checkpoints } = await db
    .from('assignment_checkpoints')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('position');
  return NextResponse.json({
    data: {
      id: assignment.id,
      classroomId: assignment.classroom_id,
      title: assignment.title,
      description: assignment.description,
      dueAt: assignment.due_at,
      checkpoints: (checkpoints ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        dueAt: item.due_at,
        position: item.position
      }))
    }
  });
}
