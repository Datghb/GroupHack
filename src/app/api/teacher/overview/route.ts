import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const { userId, role } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'TEACHER')
    return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
  const db = getSupabaseAdmin();
  const { data: classes, error } = await db
    .from('classrooms')
    .select('id,name')
    .eq('teacher_id', userId)
    .eq('archived', false);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const classIds = (classes ?? []).map((item) => item.id);
  if (!classIds.length)
    return NextResponse.json({
      data: {
        classCount: 0,
        studentCount: 0,
        teamCount: 0,
        assignmentCount: 0,
        assignments: []
      }
    });
  const [{ data: enrollments }, { data: assignments }, { data: teams }] = await Promise.all([
    db.from('class_enrollments').select('student_id').in('classroom_id', classIds),
    db
      .from('assignments')
      .select('id,title,classroom_id,course_id,created_at')
      .in('classroom_id', classIds)
      .order('created_at', { ascending: false }),
    db.from('assignment_teams').select('id').in('classroom_id', classIds)
  ]);
  const assignmentIds = (assignments ?? []).map((item) => item.id);
  const [{ data: checkpoints }, { data: completions }] = await Promise.all([
    assignmentIds.length
      ? db.from('assignment_checkpoints').select('assignment_id').in('assignment_id', assignmentIds)
      : Promise.resolve({ data: [] }),
    assignmentIds.length
      ? db
          .from('checkpoint_completions')
          .select('assignment_id,team_id')
          .in('assignment_id', assignmentIds)
      : Promise.resolve({ data: [] })
  ]);
  return NextResponse.json({
    data: {
      classCount: classIds.length,
      studentCount: new Set((enrollments ?? []).map((item) => item.student_id)).size,
      teamCount: teams?.length ?? 0,
      assignmentCount: assignments?.length ?? 0,
      assignments: (assignments ?? []).slice(0, 8).map((assignment) => {
        const totalCheckpoints = (checkpoints ?? []).filter(
          (item) => item.assignment_id === assignment.id
        ).length;
        const assignmentCompletions = (completions ?? []).filter(
          (item) => item.assignment_id === assignment.id
        );
        const teamCount = new Set(assignmentCompletions.map((item) => item.team_id)).size;
        return {
          id: assignment.id,
          classId: assignment.classroom_id,
          title: assignment.title,
          className:
            classes?.find((item) => item.id === assignment.classroom_id)?.name ?? 'Lớp học',
          totalCheckpoints,
          activeTeamCount: teamCount
        };
      })
    }
  });
}
