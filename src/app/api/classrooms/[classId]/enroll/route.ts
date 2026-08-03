import { getApiAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
export async function POST(_: Request, { params }: { params: Promise<{ classId: string }> }) {
  const [{ userId, role }, { classId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role === 'TEACHER')
    return NextResponse.json({ error: 'Chỉ học sinh được tham gia lớp.' }, { status: 403 });
  const db = getSupabaseAdmin();
  const { data: classroom } = await db
    .from('classrooms')
    .select('id,archived')
    .eq('id', classId)
    .maybeSingle();
  if (!classroom || classroom.archived)
    return NextResponse.json({ error: 'Lớp không tồn tại hoặc đã đóng.' }, { status: 404 });
  const { data: defaultCourse } = await db
    .from('classroom_courses')
    .select('id')
    .eq('classroom_id', classId)
    .order('position')
    .limit(1)
    .maybeSingle();
  if (!defaultCourse)
    return NextResponse.json(
      { error: 'Lớp chưa được cấu hình khóa học. Giáo viên cần hoàn tất cấu hình.' },
      { status: 409 }
    );
  const { error } = await db.from('class_enrollments').upsert(
    {
      classroom_id: classId,
      student_id: userId,
      course_id: defaultCourse.id
    },
    { onConflict: 'classroom_id,student_id', ignoreDuplicates: true }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { joined: true } });
}
