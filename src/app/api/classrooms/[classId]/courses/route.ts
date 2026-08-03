import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { canAccessClassroom } from '@/lib/classroom-access';

const selectionSchema = z.object({ courseId: z.string().uuid() });

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const [{ userId, role }, { classId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (!(await canAccessClassroom(userId, role, classId)))
    return NextResponse.json({ error: 'Bạn không có quyền xem khóa học.' }, { status: 403 });
  const db = getSupabaseAdmin();
  const [{ data: courses, error }, { data: enrollment }] = await Promise.all([
    db
      .from('classroom_courses')
      .select('id,name,position')
      .eq('classroom_id', classId)
      .order('position'),
    db
      .from('class_enrollments')
      .select('course_id')
      .eq('classroom_id', classId)
      .eq('student_id', userId)
      .maybeSingle()
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: {
      courses: courses ?? [],
      selectedCourseId: enrollment?.course_id ?? courses?.[0]?.id ?? null
    }
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const [{ userId, role }, { classId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'STUDENT')
    return NextResponse.json({ error: 'Chỉ học sinh được chọn khóa.' }, { status: 403 });
  const parsed = selectionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Khóa không hợp lệ.' }, { status: 400 });
  const db = getSupabaseAdmin();
  const { data: course } = await db
    .from('classroom_courses')
    .select('id')
    .eq('id', parsed.data.courseId)
    .eq('classroom_id', classId)
    .maybeSingle();
  if (!course) return NextResponse.json({ error: 'Khóa không thuộc lớp này.' }, { status: 404 });
  const { data, error } = await db
    .from('class_enrollments')
    .update({ course_id: course.id })
    .eq('classroom_id', classId)
    .eq('student_id', userId)
    .select('id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Bạn chưa tham gia lớp.' }, { status: 403 });
  return NextResponse.json({ data: { selectedCourseId: course.id } });
}
