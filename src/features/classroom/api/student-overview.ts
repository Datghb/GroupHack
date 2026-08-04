import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getCheckpointCompletionState } from '../domain/checkpoint-completion';
import { calculateCheckpointProgress, isAssignmentCompleted } from '../domain/student-progress';

export interface StudentOverviewData {
  classCount: number;
  assignmentCount: number;
  teamCount: number;
  completedCount: number;
  assignments: Array<{
    id: string;
    classId: string;
    title: string;
    className: string;
    dueAt: string | null;
    hasTeam: boolean;
    completed: number;
    total: number;
    progress: number;
  }>;
}

const EMPTY_OVERVIEW: StudentOverviewData = {
  classCount: 0,
  assignmentCount: 0,
  teamCount: 0,
  completedCount: 0,
  assignments: []
};

export async function getStudentOverviewData(userId: string): Promise<StudentOverviewData> {
  const db = getSupabaseAdmin();
  const { data: enrollments, error } = await db
    .from('class_enrollments')
    .select('classroom_id,course_id')
    .eq('student_id', userId);
  if (error) throw new Error(error.message);

  const classIds = (enrollments ?? []).map((item) => item.classroom_id);
  if (!classIds.length) return EMPTY_OVERVIEW;

  const courseIds = (enrollments ?? []).map((item) => item.course_id).filter(Boolean);
  const [{ data: classrooms }, { data: assignments }] = await Promise.all([
    db.from('classrooms').select('id,name').in('id', classIds),
    courseIds.length
      ? db
          .from('assignments')
          .select('id,title,classroom_id,course_id,due_at')
          .in('course_id', courseIds)
          .in('classroom_id', classIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] })
  ]);
  const assignmentIds = (assignments ?? []).map((item) => item.id);
  const [{ data: memberships }, { data: checkpoints }] = await Promise.all([
    assignmentIds.length
      ? db
          .from('assignment_team_members')
          .select('assignment_id,team_id')
          .eq('student_id', userId)
          .in('assignment_id', assignmentIds)
      : Promise.resolve({ data: [] }),
    assignmentIds.length
      ? db
          .from('assignment_checkpoints')
          .select('id,assignment_id,scope')
          .in('assignment_id', assignmentIds)
      : Promise.resolve({ data: [] })
  ]);
  const teamIds = (memberships ?? []).map((item) => item.team_id);
  const [{ data: completions }, { data: teamMembers }] = await Promise.all([
    teamIds.length
      ? db
          .from('checkpoint_completions')
          .select('assignment_id,team_id,checkpoint_id,completed_by,completion_scope')
          .in('team_id', teamIds)
      : Promise.resolve({ data: [] }),
    teamIds.length
      ? db.from('assignment_team_members').select('team_id,student_id').in('team_id', teamIds)
      : Promise.resolve({ data: [] })
  ]);

  const classroomNames = new Map((classrooms ?? []).map((item) => [item.id, item.name]));
  const membershipByAssignment = new Map(
    (memberships ?? []).map((item) => [item.assignment_id, item])
  );
  const checkpointsByAssignment = Map.groupBy(
    checkpoints ?? [],
    (checkpoint) => checkpoint.assignment_id
  );
  const completionsByAssignment = Map.groupBy(
    completions ?? [],
    (completion) => completion.assignment_id
  );
  const membersByTeam = Map.groupBy(teamMembers ?? [], (member) => member.team_id);

  const assignmentRows = (assignments ?? []).map((assignment) => {
    const membership = membershipByAssignment.get(assignment.id);
    const assignmentCheckpoints = checkpointsByAssignment.get(assignment.id) ?? [];
    const completed = membership
      ? getCheckpointCompletionState({
          checkpoints: assignmentCheckpoints.map((checkpoint) => ({
            id: checkpoint.id,
            scope: checkpoint.scope as 'INDIVIDUAL' | 'TEAM'
          })),
          completions: (completionsByAssignment.get(assignment.id) ?? [])
            .filter((item) => item.team_id === membership.team_id)
            .map((completion) => ({
              checkpoint_id: completion.checkpoint_id,
              completed_by: completion.completed_by,
              completion_scope: completion.completion_scope as 'INDIVIDUAL' | 'TEAM'
            })),
          memberIds: (membersByTeam.get(membership.team_id) ?? []).map(
            (member) => member.student_id
          ),
          currentUserId: userId
        }).completedCheckpointIds.length
      : 0;
    const total = assignmentCheckpoints.length;
    return {
      id: assignment.id,
      classId: assignment.classroom_id,
      title: assignment.title,
      className: classroomNames.get(assignment.classroom_id) ?? 'Lớp học',
      dueAt: assignment.due_at,
      hasTeam: Boolean(membership),
      completed,
      total,
      progress: calculateCheckpointProgress(completed, total)
    };
  });

  return {
    classCount: classIds.length,
    assignmentCount: assignmentRows.length,
    teamCount: memberships?.length ?? 0,
    completedCount: assignmentRows.filter((item) =>
      isAssignmentCompleted(item.completed, item.total)
    ).length,
    assignments: assignmentRows.slice(0, 8)
  };
}
