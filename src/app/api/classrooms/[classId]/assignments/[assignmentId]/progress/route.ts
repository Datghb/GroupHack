import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { canAccessAssignment } from '@/lib/classroom-access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { calculateCheckpointProgress } from '@/features/classroom/domain/student-progress';
import { getCheckpointCompletionState } from '@/features/classroom/domain/checkpoint-completion';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string; assignmentId: string }> }
) {
  const [{ userId, role }, { classId, assignmentId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (!(await canAccessAssignment(userId, role, classId, assignmentId)))
    return NextResponse.json({ error: 'Bạn không có quyền xem tiến độ.' }, { status: 403 });

  const db = getSupabaseAdmin();
  const [{ data: checkpoints }, { data: teams }, { data: completions }] = await Promise.all([
    db
      .from('assignment_checkpoints')
      .select('id,title,due_at,position,scope')
      .eq('assignment_id', assignmentId)
      .order('position'),
    db
      .from('assignment_teams')
      .select('id,name,leader_id')
      .eq('assignment_id', assignmentId)
      .order('created_at'),
    db
      .from('checkpoint_completions')
      .select('checkpoint_id,team_id,completed_by,completed_at,completion_scope')
      .eq('assignment_id', assignmentId)
  ]);
  const teamIds = (teams ?? []).map((team) => team.id);
  const { data: members } = teamIds.length
    ? await db.from('assignment_team_members').select('team_id,student_id').in('team_id', teamIds)
    : { data: [] };
  const total = checkpoints?.length ?? 0;
  const data = (teams ?? []).map((team) => {
    const memberIds = (members ?? [])
      .filter((item) => item.team_id === team.id)
      .map((item) => item.student_id);
    const teamCompletions = (completions ?? []).filter((item) => item.team_id === team.id);
    const completionState = getCheckpointCompletionState({
      checkpoints: (checkpoints ?? []).map((checkpoint) => ({
        id: checkpoint.id,
        scope: checkpoint.scope as 'INDIVIDUAL' | 'TEAM'
      })),
      completions: teamCompletions.map((completion) => ({
        checkpoint_id: completion.checkpoint_id,
        completed_by: completion.completed_by,
        completion_scope: completion.completion_scope as 'INDIVIDUAL' | 'TEAM'
      })),
      memberIds,
      currentUserId: userId
    });
    const completedIds = new Set(completionState.completedCheckpointIds);
    const current = (checkpoints ?? []).find((item) => !completedIds.has(item.id));
    const late = (checkpoints ?? []).filter(
      (item) => !completedIds.has(item.id) && item.due_at && new Date(item.due_at) < new Date()
    ).length;
    const lastActivityAt =
      teamCompletions
        .map((item) => item.completed_at)
        .toSorted()
        .at(-1) ?? null;
    return {
      id: team.id,
      name: team.name,
      leaderId: team.leader_id,
      memberIds,
      completedCheckpointIds: [...completedIds],
      myCompletedCheckpointIds: completionState.myCompletedCheckpointIds,
      completedCheckpoints: completedIds.size,
      totalCheckpoints: total,
      currentCheckpoint: current?.title ?? (total ? 'Đã hoàn thành' : 'Chưa có checkpoint'),
      progress: calculateCheckpointProgress(completedIds.size, total),
      lateCheckpoints: late,
      lastActivityAt
    };
  });
  return NextResponse.json({ data });
}
