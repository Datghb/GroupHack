import { getApiAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(240).optional().default('')
});
export async function GET() {
  const { userId, role } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  try {
    const db = getSupabaseAdmin();
    let classesQuery = db.from('classrooms').select('*').eq('archived', false);
    if (role === 'TEACHER') classesQuery = classesQuery.eq('teacher_id', userId);
    const [{ data: classes, error }, { data: enrollments }] = await Promise.all([
      classesQuery.order('created_at', { ascending: false }),
      db.from('class_enrollments').select('classroom_id').eq('student_id', userId)
    ]);
    if (error) throw error;
    const joinedIds = new Set((enrollments ?? []).map((item) => item.classroom_id));
    const data = (classes ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      teacherId: item.teacher_id,
      archived: item.archived,
      studentCount: 0,
      teamCount: 0,
      joined: joinedIds.has(item.id)
    }));
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lỗi Supabase.' },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  const { userId, role } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'TEACHER')
    return NextResponse.json({ error: 'Chỉ giáo viên được tạo lớp.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Thông tin lớp học không hợp lệ.' }, { status: 400 });
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('classrooms')
      .insert({ ...parsed.data, teacher_id: userId })
      .select()
      .single();
    if (error) throw error;
    const { error: courseError } = await db.from('classroom_courses').insert([
      { classroom_id: data.id, name: 'Khóa 3', position: 1 },
      { classroom_id: data.id, name: 'Khóa 4', position: 2 }
    ]);
    if (courseError) {
      await db.from('classrooms').delete().eq('id', data.id);
      throw courseError;
    }
    return NextResponse.json(
      {
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          teacherId: data.teacher_id,
          archived: data.archived,
          studentCount: 0,
          teamCount: 0,
          joined: false
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lỗi Supabase.' },
      { status: 500 }
    );
  }
}
