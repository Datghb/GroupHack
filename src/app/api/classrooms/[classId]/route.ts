import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { canDeleteClassroom } from '@/features/classroom/domain/classroom-deletion';

const paramsSchema = z.object({
  classId: z.string().uuid()
});

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const [{ userId, role }, rawParams] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });

  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success)
    return NextResponse.json({ error: 'Mã lớp không hợp lệ.' }, { status: 400 });
  if (role !== 'TEACHER')
    return NextResponse.json({ error: 'Chỉ giáo viên được xóa lớp.' }, { status: 403 });

  const db = getSupabaseAdmin();
  const { data: classroom, error: classroomError } = await db
    .from('classrooms')
    .select('id,teacher_id')
    .eq('id', parsedParams.data.classId)
    .maybeSingle();

  if (classroomError) return NextResponse.json({ error: classroomError.message }, { status: 500 });
  if (!classroom) return NextResponse.json({ error: 'Không tìm thấy lớp học.' }, { status: 404 });
  if (!canDeleteClassroom(role, classroom.teacher_id, userId))
    return NextResponse.json({ error: 'Bạn không có quyền xóa lớp này.' }, { status: 403 });

  const { error: deleteError } = await db
    .from('classrooms')
    .delete()
    .eq('id', classroom.id)
    .eq('teacher_id', userId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ data: { deleted: true } });
}
