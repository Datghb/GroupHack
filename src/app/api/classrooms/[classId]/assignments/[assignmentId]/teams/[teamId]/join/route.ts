import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { canAccessAssignment } from '@/lib/classroom-access';
export async function POST(
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
    return NextResponse.json({ error: 'Chỉ học sinh được tham gia nhóm.' }, { status: 403 });
  const db = getSupabaseAdmin();
  if (!(await canAccessAssignment(userId, role, classId, assignmentId)))
    return NextResponse.json({ error: 'Bài tập không thuộc khóa bạn đang học.' }, { status: 403 });
  const { data: enrollment } = await db
    .from('class_enrollments')
    .select('id')
    .eq('classroom_id', classId)
    .eq('student_id', userId)
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: 'Bạn chưa tham gia lớp.' }, { status: 403 });
  const { data: team } = await db
    .from('assignment_teams')
    .select('*')
    .eq('id', teamId)
    .eq('assignment_id', assignmentId)
    .eq('classroom_id', classId)
    .maybeSingle();
  if (!team || !team.open)
    return NextResponse.json({ error: 'Nhóm không tồn tại hoặc đã đóng.' }, { status: 404 });
  const { data: existingMember } = await db
    .from('assignment_team_members')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('student_id', userId)
    .maybeSingle();
  if (existingMember)
    return NextResponse.json({ error: 'Bạn đã có nhóm trong bài tập này.' }, { status: 409 });
  const { data: request, error } = await db
    .from('assignment_team_join_requests')
    .upsert(
      {
        team_id: teamId,
        assignment_id: assignmentId,
        student_id: userId,
        status: 'PENDING',
        reviewed_at: null,
        reviewed_by: null
      },
      { onConflict: 'assignment_id,student_id' }
    )
    .select('id,status')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { data: { id: request.id, teamId, status: request.status } },
    { status: 201 }
  );
}
