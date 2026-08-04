import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { canAccessAssignment } from '@/lib/classroom-access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { calculateCheckpointProgress } from '@/features/classroom/domain/student-progress';
import { getCheckpointCompletionState } from '@/features/classroom/domain/checkpoint-completion';
import { getVisibleTeamMemberProgress } from '@/features/classroom/domain/team-progress-visibility';

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
  const visibleMemberIds =
    role === 'TEACHER'
      ? (members ?? []).map((member) => member.student_id)
      : (members ?? [])
          .filter((member) => member.student_id === userId)
          .flatMap((membership) =>
            (members ?? [])
              .filter((member) => member.team_id === membership.team_id)
              .map((member) => member.student_id)
          );
  const memberUserIds = [...new Set(visibleMemberIds)];
  const { data: authUsers } = memberUserIds.length
    ? await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
    : { data: { users: [] } };
  const users = new Map(
    authUsers.users
      .filter((authUser) => memberUserIds.includes(authUser.id))
      .map((authUser) => [
        authUser.id,
        {
          id: authUser.id,
          fullName:
            authUser.user_metadata.full_name ||
            authUser.user_metadata.name ||
            authUser.email ||
            'Thành viên',
          avatarUrl: authUser.user_metadata.avatar_url || authUser.user_metadata.picture || null
        }
      ])
  );
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
    const memberProgress = getVisibleTeamMemberProgress({
      role,
      userId,
      memberIds,
      memberProgress: memberIds.map((memberId) => ({
        ...(users.get(memberId) ?? {
          id: memberId,
          fullName: 'Thành viên',
          avatarUrl: null
        }),
        completedCheckpointIds: teamCompletions
          .filter((completion) => completion.completed_by === memberId)
          .map((completion) => completion.checkpoint_id)
      }))
    });
    return {
      id: team.id,
      name: team.name,
      leaderId: team.leader_id,
      memberIds,
      completedCheckpointIds: [...completedIds],
      myCompletedCheckpointIds: completionState.myCompletedCheckpointIds,
      ...(memberProgress && { memberProgress }),
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
