import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { canAccessAssignment } from '@/lib/classroom-access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function getContext(
  params: Promise<{
    classId: string;
    assignmentId: string;
    checkpointId: string;
  }>
) {
  const [{ userId, role }, values] = await Promise.all([getApiAuth(), params]);
  if (!userId || role !== 'STUDENT') return null;
  if (!(await canAccessAssignment(userId, role, values.classId, values.assignmentId))) return null;
  const db = getSupabaseAdmin();
  const [{ data: checkpoint }, { data: membership }] = await Promise.all([
    db
      .from('assignment_checkpoints')
      .select('id,scope')
      .eq('id', values.checkpointId)
      .eq('assignment_id', values.assignmentId)
      .maybeSingle(),
    db
      .from('assignment_team_members')
      .select('team_id')
      .eq('assignment_id', values.assignmentId)
      .eq('student_id', userId)
      .maybeSingle()
  ]);
  if (!checkpoint || !membership) return null;
  return {
    db,
    userId,
    values,
    teamId: membership.team_id,
    scope: checkpoint.scope as 'INDIVIDUAL' | 'TEAM'
  };
}

export async function POST(
  _request: Request,
  {
    params
  }: {
    params: Promise<{
      classId: string;
      assignmentId: string;
      checkpointId: string;
    }>;
  }
) {
  const context = await getContext(params);
  if (!context)
    return NextResponse.json(
      { error: 'Bạn cần tham gia nhóm trước khi cập nhật tiến độ.' },
      { status: 403 }
    );
  let existingQuery = context.db
    .from('checkpoint_completions')
    .select('id')
    .eq('checkpoint_id', context.values.checkpointId)
    .eq('completion_scope', context.scope);
  existingQuery =
    context.scope === 'INDIVIDUAL'
      ? existingQuery.eq('completed_by', context.userId)
      : existingQuery.eq('team_id', context.teamId);
  const { data: existing, error: readError } = await existingQuery.maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const completion = {
    checkpoint_id: context.values.checkpointId,
    assignment_id: context.values.assignmentId,
    team_id: context.teamId,
    completed_by: context.userId,
    completed_at: new Date().toISOString(),
    completion_scope: context.scope
  };
  const { error } = existing
    ? await context.db.from('checkpoint_completions').update(completion).eq('id', existing.id)
    : await context.db.from('checkpoint_completions').insert(completion);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { completed: true } });
}

export async function DELETE(
  _request: Request,
  {
    params
  }: {
    params: Promise<{
      classId: string;
      assignmentId: string;
      checkpointId: string;
    }>;
  }
) {
  const context = await getContext(params);
  if (!context) return NextResponse.json({ error: 'Không có quyền cập nhật.' }, { status: 403 });
  let deleteQuery = context.db
    .from('checkpoint_completions')
    .delete()
    .eq('checkpoint_id', context.values.checkpointId)
    .eq('completion_scope', context.scope);
  deleteQuery =
    context.scope === 'INDIVIDUAL'
      ? deleteQuery.eq('completed_by', context.userId)
      : deleteQuery.eq('team_id', context.teamId);
  const { error } = await deleteQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { completed: false } });
}
