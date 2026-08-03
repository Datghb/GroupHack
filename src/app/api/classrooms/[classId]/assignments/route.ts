import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { canAccessClassroom } from '@/lib/classroom-access';
import { getCheckpointTitle } from '@/features/classroom/domain/checkpoint-label';

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1000).default(''),
  dueAt: z.string().optional().default(''),
  courseId: z.string().uuid(),
  checkpoints: z
    .array(
      z.object({
        dueAt: z.string().optional().default(''),
        scope: z.enum(['INDIVIDUAL', 'TEAM'])
      })
    )
    .min(1)
    .max(20)
});
const listSchema = z.object({
  courseId: z.string().uuid().optional()
});
interface AssignmentRow {
  id: string;
  classroom_id: string;
  course_id: string | null;
  title: string;
  description: string;
  due_at: string | null;
}
interface CheckpointRow {
  id: string;
  assignment_id: string;
  title: string;
  description: string;
  due_at: string | null;
  position: number;
  scope: 'INDIVIDUAL' | 'TEAM';
}
const mapAssignment = (item: AssignmentRow, checkpoints: CheckpointRow[] = []) => ({
  id: item.id,
  classroomId: item.classroom_id,
  courseId: item.course_id,
  title: item.title,
  description: item.description,
  dueAt: item.due_at,
  checkpoints: checkpoints.map((checkpoint) => ({
    id: checkpoint.id,
    title: checkpoint.title,
    description: checkpoint.description,
    dueAt: checkpoint.due_at,
    position: checkpoint.position,
    scope: checkpoint.scope
  }))
});

export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const [{ userId, role }, { classId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!(await canAccessClassroom(userId, role, classId)))
    return NextResponse.json({ error: 'Bạn không có quyền truy cập lớp này.' }, { status: 403 });
  const parsedQuery = listSchema.safeParse({
    courseId: new URL(request.url).searchParams.get('courseId') ?? undefined
  });
  if (!parsedQuery.success)
    return NextResponse.json({ error: 'Mã khóa học không hợp lệ.' }, { status: 400 });

  let courseId = parsedQuery.data.courseId;
  if (role !== 'TEACHER') {
    const { data: enrollment } = await db
      .from('class_enrollments')
      .select('course_id')
      .eq('classroom_id', classId)
      .eq('student_id', userId)
      .maybeSingle();
    if (!enrollment?.course_id)
      return NextResponse.json({ error: 'Bạn chưa được xếp vào khóa học.' }, { status: 403 });
    courseId = enrollment.course_id;
  }
  let assignmentQuery = db.from('assignments').select('*').eq('classroom_id', classId);
  if (courseId) assignmentQuery = assignmentQuery.eq('course_id', courseId);
  const { data: assignments, error } = await assignmentQuery.order('created_at', {
    ascending: false
  });
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
  const { data: course } = await db
    .from('classroom_courses')
    .select('id')
    .eq('id', value.courseId)
    .eq('classroom_id', classId)
    .maybeSingle();
  if (!course) return NextResponse.json({ error: 'Khóa không thuộc lớp này.' }, { status: 400 });
  const { data: assignment, error } = await db
    .from('assignments')
    .insert({
      classroom_id: classId,
      course_id: course.id,
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
        title: getCheckpointTitle(position),
        description: '',
        due_at: checkpoint.dueAt || null,
        position,
        scope: checkpoint.scope
      }))
    )
    .select();
  if (checkpointError) {
    await db.from('assignments').delete().eq('id', assignment.id);
    return NextResponse.json({ error: checkpointError.message }, { status: 500 });
  }
  return NextResponse.json({ data: mapAssignment(assignment, checkpoints ?? []) }, { status: 201 });
}
