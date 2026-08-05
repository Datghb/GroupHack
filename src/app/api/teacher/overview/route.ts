import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { buildTeacherOverviewData } from '@/features/classroom/domain/teacher-overview';

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
      .select('id,title,classroom_id,created_at')
      .in('classroom_id', classIds)
      .order('created_at', { ascending: false }),
    db.from('assignment_teams').select('id').in('classroom_id', classIds)
  ]);
  const assignmentRows = assignments ?? [];
  const recentAssignments = assignmentRows.slice(0, 8);
  const recentAssignmentIds = recentAssignments.map((item) => item.id);
  const [{ data: checkpoints }, { data: completions }] = await Promise.all([
    recentAssignmentIds.length
      ? db
          .from('assignment_checkpoints')
          .select('assignment_id')
          .in('assignment_id', recentAssignmentIds)
      : Promise.resolve({ data: [] }),
    recentAssignmentIds.length
      ? db
          .from('checkpoint_completions')
          .select('assignment_id,team_id')
          .in('assignment_id', recentAssignmentIds)
      : Promise.resolve({ data: [] })
  ]);
  return NextResponse.json({
    data: buildTeacherOverviewData({
      classes: classes ?? [],
      enrollments: enrollments ?? [],
      assignmentCount: assignmentRows.length,
      recentAssignments,
      teams: teams ?? [],
      checkpoints: checkpoints ?? [],
      completions: completions ?? []
    })
  });
}
