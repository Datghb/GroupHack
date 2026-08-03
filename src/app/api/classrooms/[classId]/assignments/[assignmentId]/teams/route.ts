import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).default(''),
  capacity: z.number().int().min(2).max(10)
});
const mapTeam = (team: any, members: any[]) => ({
  id: team.id,
  name: team.name,
  description: team.description,
  leaderId: team.leader_id,
  capacity: team.capacity,
  open: team.open,
  memberIds: members.filter((item) => item.team_id === team.id).map((item) => item.student_id)
});
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string; assignmentId: string }> }
) {
  const [{ userId }, { classId, assignmentId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const db = getSupabaseAdmin();
  const { data: teams, error } = await db
    .from('assignment_teams')
    .select('*')
    .eq('classroom_id', classId)
    .eq('assignment_id', assignmentId)
    .order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (teams ?? []).map((item) => item.id);
  const { data: members } = ids.length
    ? await db.from('assignment_team_members').select('*').in('team_id', ids)
    : { data: [] };
  return NextResponse.json({
    data: (teams ?? []).map((team) => mapTeam(team, members ?? []))
  });
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string; assignmentId: string }> }
) {
  const [{ userId, role }, { classId, assignmentId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'STUDENT')
    return NextResponse.json({ error: 'Chỉ học sinh được tạo nhóm.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Thông tin nhóm không hợp lệ.' }, { status: 400 });
  const db = getSupabaseAdmin();
  const [{ data: enrollment }, { data: existing }] = await Promise.all([
    db
      .from('class_enrollments')
      .select('id')
      .eq('classroom_id', classId)
      .eq('student_id', userId)
      .maybeSingle(),
    db
      .from('assignment_team_members')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', userId)
      .maybeSingle()
  ]);
  if (!enrollment) return NextResponse.json({ error: 'Bạn chưa tham gia lớp.' }, { status: 403 });
  if (existing)
    return NextResponse.json({ error: 'Bạn đã có nhóm trong bài tập này.' }, { status: 409 });
  const { data: team, error } = await db
    .from('assignment_teams')
    .insert({
      ...parsed.data,
      classroom_id: classId,
      assignment_id: assignmentId,
      leader_id: userId
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { error: memberError } = await db.from('assignment_team_members').insert({
    team_id: team.id,
    assignment_id: assignmentId,
    student_id: userId
  });
  if (memberError) {
    await db.from('assignment_teams').delete().eq('id', team.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }
  return NextResponse.json(
    { data: mapTeam(team, [{ team_id: team.id, student_id: userId }]) },
    { status: 201 }
  );
}
