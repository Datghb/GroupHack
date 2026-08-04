import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { canAccessAssignment, canManageAssignment } from '@/lib/classroom-access';
import { getCheckpointTitle } from '@/features/classroom/domain/checkpoint-label';

const updateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1000).default(''),
  dueAt: z.string().optional().default(''),
  checkpoints: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        dueAt: z.string().optional().default(''),
        scope: z.enum(['INDIVIDUAL', 'TEAM'])
      })
    )
    .min(1)
    .max(20)
});

const mapAssignment = (
  assignment: Record<string, unknown>,
  checkpoints: Array<Record<string, unknown>>
) => ({
  id: assignment.id,
  classroomId: assignment.classroom_id,
  courseId: assignment.course_id,
  title: assignment.title,
  description: assignment.description,
  dueAt: assignment.due_at,
  checkpoints: checkpoints.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    dueAt: item.due_at,
    position: item.position,
    scope: item.scope
  }))
});
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string; assignmentId: string }> }
) {
  const [{ userId, role }, { classId, assignmentId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (!(await canAccessAssignment(userId, role, classId, assignmentId)))
    return NextResponse.json({ error: 'Bạn không có quyền xem bài tập này.' }, { status: 403 });
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
      courseId: assignment.course_id,
      title: assignment.title,
      description: assignment.description,
      dueAt: assignment.due_at,
      checkpoints: (checkpoints ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        dueAt: item.due_at,
        position: item.position,
        scope: item.scope
      }))
    }
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ classId: string; assignmentId: string }> }
) {
  const [{ userId, role }, { classId, assignmentId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'TEACHER' || !(await canManageAssignment(userId, classId, assignmentId)))
    return NextResponse.json(
      { error: 'Bạn không có quyền chỉnh sửa bài tập này.' },
      { status: 403 }
    );

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Bài tập phải có tên và ít nhất một checkpoint hợp lệ.' },
      { status: 400 }
    );

  const db = getSupabaseAdmin();
  const existingIds = parsed.data.checkpoints.flatMap((checkpoint) =>
    checkpoint.id ? [checkpoint.id] : []
  );
  if (existingIds.length) {
    const { data: ownedCheckpoints, error: ownershipError } = await db
      .from('assignment_checkpoints')
      .select('id')
      .eq('assignment_id', assignmentId)
      .in('id', existingIds);
    if (ownershipError)
      return NextResponse.json({ error: ownershipError.message }, { status: 500 });
    if ((ownedCheckpoints ?? []).length !== existingIds.length)
      return NextResponse.json({ error: 'Checkpoint không thuộc bài tập này.' }, { status: 400 });
  }

  const value = parsed.data;
  const retainedIds = new Set(existingIds);
  const { data: currentCheckpoints, error: checkpointReadError } = await db
    .from('assignment_checkpoints')
    .select('id')
    .eq('assignment_id', assignmentId);
  if (checkpointReadError)
    return NextResponse.json({ error: checkpointReadError.message }, { status: 500 });
  const removedIds = (currentCheckpoints ?? [])
    .map((checkpoint) => checkpoint.id)
    .filter((id) => !retainedIds.has(id));
  const checkpointRows = value.checkpoints.map((checkpoint, position) => ({
    ...(checkpoint.id ? { id: checkpoint.id } : {}),
    assignment_id: assignmentId,
    title: getCheckpointTitle(position),
    description: '',
    due_at: checkpoint.dueAt || null,
    position,
    scope: checkpoint.scope
  }));
  const { data: checkpoints, error: upsertError } = await db
    .from('assignment_checkpoints')
    .upsert(checkpointRows)
    .select();
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  const { data: assignment, error: assignmentError } = await db
    .from('assignments')
    .update({
      title: value.title,
      description: value.description,
      due_at: value.dueAt || null
    })
    .eq('id', assignmentId)
    .eq('classroom_id', classId)
    .select()
    .single();
  if (assignmentError)
    return NextResponse.json({ error: assignmentError.message }, { status: 500 });

  if (removedIds.length) {
    const { error: deleteError } = await db
      .from('assignment_checkpoints')
      .delete()
      .in('id', removedIds);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: mapAssignment(
      assignment,
      (checkpoints ?? []).toSorted((a, b) => a.position - b.position)
    )
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ classId: string; assignmentId: string }> }
) {
  const [{ userId, role }, { classId, assignmentId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'TEACHER' || !(await canManageAssignment(userId, classId, assignmentId)))
    return NextResponse.json({ error: 'Bạn không có quyền xóa bài tập này.' }, { status: 403 });
  const { error } = await getSupabaseAdmin().from('assignments').delete().eq('id', assignmentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { deleted: true } });
}
