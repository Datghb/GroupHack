import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  calculateCheckpointProgress,
  isAssignmentCompleted
} from '@/features/classroom/domain/student-progress';

export async function GET() {
  const { userId, role } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'STUDENT')
    return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
  const db = getSupabaseAdmin();
  const { data: enrollments, error } = await db
    .from('class_enrollments')
    .select('classroom_id,course_id')
    .eq('student_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const classIds = (enrollments ?? []).map((item) => item.classroom_id);
  if (!classIds.length)
    return NextResponse.json({
      data: { classCount: 0, assignmentCount: 0, teamCount: 0, completedCount: 0, assignments: [] }
    });

  const courseIds = (enrollments ?? []).map((item) => item.course_id).filter(Boolean);
  const [{ data: classrooms }, { data: assignments }] = await Promise.all([
    db.from('classrooms').select('id,name').in('id', classIds),
    courseIds.length
      ? db
          .from('assignments')
          .select('id,title,classroom_id,course_id,due_at')
          .in('course_id', courseIds)
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
          .select('id,assignment_id')
          .in('assignment_id', assignmentIds)
      : Promise.resolve({ data: [] })
  ]);
  const teamIds = (memberships ?? []).map((item) => item.team_id);
  const { data: completions } = teamIds.length
    ? await db
        .from('checkpoint_completions')
        .select('assignment_id,team_id,checkpoint_id')
        .in('team_id', teamIds)
    : { data: [] };
  const assignmentRows = (assignments ?? []).map((assignment) => {
    const membership = (memberships ?? []).find((item) => item.assignment_id === assignment.id);
    const total = (checkpoints ?? []).filter((item) => item.assignment_id === assignment.id).length;
    const completed = membership
      ? (completions ?? []).filter(
          (item) => item.assignment_id === assignment.id && item.team_id === membership.team_id
        ).length
      : 0;
    return {
      id: assignment.id,
      classId: assignment.classroom_id,
      title: assignment.title,
      className:
        (classrooms ?? []).find((item) => item.id === assignment.classroom_id)?.name ?? 'Lớp học',
      dueAt: assignment.due_at,
      hasTeam: Boolean(membership),
      completed,
      total,
      progress: calculateCheckpointProgress(completed, total)
    };
  });
  return NextResponse.json({
    data: {
      classCount: classIds.length,
      assignmentCount: assignmentRows.length,
      teamCount: memberships?.length ?? 0,
      completedCount: assignmentRows.filter((item) =>
        isAssignmentCompleted(item.completed, item.total)
      ).length,
      assignments: assignmentRows.slice(0, 8)
    }
  });
}
