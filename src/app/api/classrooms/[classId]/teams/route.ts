import { getApiAuth } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(160),
  capacity: z.number().int().min(2).max(10)
});
export async function GET(_: Request, { params }: { params: Promise<{ classId: string }> }) {
  const [{ userId }, { classId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const db = getSupabaseAdmin();
  const { data: teams, error } = await db
    .from('teams')
    .select('*,team_members(student_id)')
    .eq('classroom_id', classId)
    .eq('archived', false);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: (teams ?? []).map((team) => ({
      id: team.id,
      classroomId: team.classroom_id,
      name: team.name,
      description: team.description,
      leaderId: team.leader_id,
      capacity: team.capacity,
      open: team.open,
      memberIds: (team.team_members ?? []).map(
        (member: { student_id: string }) => member.student_id
      )
    }))
  });
}
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const [{ userId, role }, { classId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role === 'TEACHER')
    return NextResponse.json({ error: 'Chỉ học sinh được tạo nhóm.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Thông tin nhóm không hợp lệ.' }, { status: 400 });
  const db = getSupabaseAdmin();
  const [{ data: enrollment }, { data: membership }] = await Promise.all([
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
      .maybeSingle()
  ]);
  if (!enrollment) return NextResponse.json({ error: 'Bạn chưa tham gia lớp.' }, { status: 403 });
  if (membership)
    return NextResponse.json({ error: 'Bạn đã thuộc một nhóm trong lớp.' }, { status: 409 });
  const { data: team, error } = await db
    .from('teams')
    .insert({ ...parsed.data, classroom_id: classId, leader_id: userId })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { error: memberError } = await db
    .from('team_members')
    .insert({ team_id: team.id, classroom_id: classId, student_id: userId });
  if (memberError) {
    await db.from('teams').delete().eq('id', team.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }
  return NextResponse.json(
    {
      data: {
        id: team.id,
        classroomId: classId,
        name: team.name,
        description: team.description,
        leaderId: userId,
        capacity: team.capacity,
        open: true,
        memberIds: [userId]
      }
    },
    { status: 201 }
  );
}
