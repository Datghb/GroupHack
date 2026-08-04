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
  const db = getSupabaseAdmin();
  const [hasAccess, { data: checkpoint }, { data: membership }] = await Promise.all([
    canAccessAssignment(userId, role, values.classId, values.assignmentId),
    db
      .from('assignment_checkpoints')
      .select('id')
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
  if (!hasAccess || !checkpoint || !membership) return null;
  return {
    db,
    userId,
    values,
    teamId: membership.team_id
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
  const completion = {
    checkpoint_id: context.values.checkpointId,
    assignment_id: context.values.assignmentId,
    team_id: context.teamId,
    completed_by: context.userId,
    completed_at: new Date().toISOString(),
    // Treat the stored scope as a member-tick marker. This avoids legacy
    // TEAM-scoped uniqueness constraints while completion is still computed
    // from all members of the assignment team.
    completion_scope: 'INDIVIDUAL' as const
  };
  const { data: existing, error: lookupError } = await context.db
    .from('checkpoint_completions')
    .select('id')
    .eq('checkpoint_id', context.values.checkpointId)
    .eq('team_id', context.teamId)
    .eq('completed_by', context.userId)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

  const { error } = existing
    ? await context.db
        .from('checkpoint_completions')
        .update({
          completed_at: completion.completed_at,
          completion_scope: completion.completion_scope
        })
        .eq('id', existing.id)
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
  const { error } = await context.db
    .from('checkpoint_completions')
    .delete()
    .eq('checkpoint_id', context.values.checkpointId)
    .eq('team_id', context.teamId)
    .eq('completed_by', context.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { completed: false } });
}
