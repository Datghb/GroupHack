import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
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
  const { data: team } = await db
    .from('assignment_teams')
    .select('*')
    .eq('id', teamId)
    .eq('assignment_id', assignmentId)
    .eq('classroom_id', classId)
    .maybeSingle();
  if (!team || !team.open)
    return NextResponse.json({ error: 'Nhóm không tồn tại hoặc đã đóng.' }, { status: 404 });
  const { count } = await db
    .from('assignment_team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId);
  if ((count ?? 0) >= team.capacity)
    return NextResponse.json({ error: 'Nhóm đã đủ thành viên.' }, { status: 409 });
  const { error } = await db.from('assignment_team_members').insert({
    team_id: teamId,
    assignment_id: assignmentId,
    student_id: userId
  });
  if (error)
    return NextResponse.json(
      {
        error: error.code === '23505' ? 'Bạn đã có nhóm trong bài tập này.' : error.message
      },
      { status: error.code === '23505' ? 409 : 500 }
    );
  return NextResponse.json({ data: { id: team.id } });
}
