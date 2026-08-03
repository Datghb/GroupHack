import { getApiAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
export async function POST(
  _: Request,
  { params }: { params: Promise<{ classId: string; teamId: string }> }
) {
  const [{ userId }, { classId, teamId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const db = getSupabaseAdmin();
  const [{ data: enrollment }, { data: existing }, { data: team }] = await Promise.all([
    db
      .from('class_enrollments')
      .select('id')
      .eq('classroom_id', classId)
      .eq('student_id', userId)
      .maybeSingle(),
    db
      .from('team_members')
      .select('id')
      .eq('classroom_id', classId)
      .eq('student_id', userId)
      .maybeSingle(),
    db
      .from('teams')
      .select('*,team_members(student_id)')
      .eq('id', teamId)
      .eq('classroom_id', classId)
      .maybeSingle()
  ]);
  if (!enrollment) return NextResponse.json({ error: 'Bạn chưa tham gia lớp.' }, { status: 403 });
  if (existing)
    return NextResponse.json({ error: 'Bạn đã thuộc một nhóm trong lớp.' }, { status: 409 });
  if (!team || !team.open || team.archived)
    return NextResponse.json({ error: 'Nhóm không nhận thành viên.' }, { status: 409 });
  if ((team.team_members ?? []).length >= team.capacity)
    return NextResponse.json({ error: 'Nhóm đã đủ thành viên.' }, { status: 409 });
  const { error } = await db
    .from('team_members')
    .insert({ team_id: teamId, classroom_id: classId, student_id: userId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: {
      id: team.id,
      classroomId: classId,
      name: team.name,
      description: team.description,
      leaderId: team.leader_id,
      capacity: team.capacity,
      open: team.open,
      memberIds: [
        ...(team.team_members ?? []).map((member: { student_id: string }) => member.student_id),
        userId
      ]
    }
  });
}
