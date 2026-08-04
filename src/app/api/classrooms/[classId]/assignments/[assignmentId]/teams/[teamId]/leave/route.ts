import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { canAccessAssignment } from '@/lib/classroom-access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getLeaveTeamError } from '@/features/classroom/domain/team-membership';

export async function DELETE(
  _request: Request,
  {
    params
  }: {
    params: Promise<{ classId: string; assignmentId: string; teamId: string }>;
  }
) {
  const [{ userId, role }, { classId, assignmentId, teamId }] = await Promise.all([
    getApiAuth(),
    params
  ]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'STUDENT')
    return NextResponse.json({ error: 'Chỉ học sinh được rời nhóm.' }, { status: 403 });
  if (!(await canAccessAssignment(userId, role, classId, assignmentId)))
    return NextResponse.json({ error: 'Bài tập không thuộc khóa bạn đang học.' }, { status: 403 });

  const { data: result, error } = await getSupabaseAdmin().rpc('leave_assignment_team', {
    p_team_id: teamId,
    p_assignment_id: assignmentId,
    p_student_id: userId
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const resultError = getLeaveTeamError(String(result));
  if (resultError) return NextResponse.json({ error: resultError }, { status: 409 });
  return NextResponse.json({ data: { status: result } });
}
