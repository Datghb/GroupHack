import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1000).default(''),
  dueAt: z.string().optional().default(''),
  checkpoints: z
    .array(
      z.object({
        title: z.string().trim().min(2).max(160),
        description: z.string().trim().max(500).default(''),
        dueAt: z.string().optional().default('')
      })
    )
    .min(1)
    .max(20)
});
const mapAssignment = (item: any, checkpoints: any[] = []) => ({
  id: item.id,
  classroomId: item.classroom_id,
  title: item.title,
  description: item.description,
  dueAt: item.due_at,
  checkpoints: checkpoints.map((checkpoint) => ({
    id: checkpoint.id,
    title: checkpoint.title,
    description: checkpoint.description,
    dueAt: checkpoint.due_at,
    position: checkpoint.position
  }))
});

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const [{ userId, role }, { classId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const db = getSupabaseAdmin();
  if (role === 'STUDENT') {
    const { data } = await db
      .from('class_enrollments')
      .select('id')
      .eq('classroom_id', classId)
      .eq('student_id', userId)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: 'Bạn chưa tham gia lớp.' }, { status: 403 });
  }
  const { data: assignments, error } = await db
    .from('assignments')
    .select('*')
    .eq('classroom_id', classId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (assignments ?? []).map((item) => item.id);
  const { data: checkpoints } = ids.length
    ? await db.from('assignment_checkpoints').select('*').in('assignment_id', ids).order('position')
    : { data: [] };
  return NextResponse.json({
    data: (assignments ?? []).map((item) =>
      mapAssignment(
        item,
        (checkpoints ?? []).filter((checkpoint) => checkpoint.assignment_id === item.id)
      )
    )
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const [{ userId, role }, { classId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'TEACHER')
    return NextResponse.json({ error: 'Chỉ giáo viên được tạo bài tập.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Bài tập phải có tên và ít nhất một checkpoint.' },
      { status: 400 }
    );
  const db = getSupabaseAdmin();
  const { data: classroom } = await db
    .from('classrooms')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', userId)
    .maybeSingle();
  if (!classroom)
    return NextResponse.json({ error: 'Bạn không phải giáo viên của lớp này.' }, { status: 403 });
  const value = parsed.data;
  const { data: assignment, error } = await db
    .from('assignments')
    .insert({
      classroom_id: classId,
      title: value.title,
      description: value.description,
      due_at: value.dueAt || null,
      created_by: userId
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: checkpoints, error: checkpointError } = await db
    .from('assignment_checkpoints')
    .insert(
      value.checkpoints.map((checkpoint, position) => ({
        assignment_id: assignment.id,
        title: checkpoint.title,
        description: checkpoint.description,
        due_at: checkpoint.dueAt || null,
        position
      }))
    )
    .select();
  if (checkpointError) {
    await db.from('assignments').delete().eq('id', assignment.id);
    return NextResponse.json({ error: checkpointError.message }, { status: 500 });
  }
  return NextResponse.json({ data: mapAssignment(assignment, checkpoints ?? []) }, { status: 201 });
}
