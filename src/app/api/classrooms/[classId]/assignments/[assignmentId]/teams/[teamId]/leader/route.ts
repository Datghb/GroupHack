import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { canAccessAssignment } from '@/lib/classroom-access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getTransferLeaderError } from '@/features/classroom/domain/team-membership';

const schema = z.object({ newLeaderId: z.string().uuid() });

export async function PATCH(
  request: Request,
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
    return NextResponse.json({ error: 'Chỉ học sinh được chuyển trưởng nhóm.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Thành viên được chọn không hợp lệ.' }, { status: 400 });
  if (!(await canAccessAssignment(userId, role, classId, assignmentId)))
    return NextResponse.json({ error: 'Bài tập không thuộc khóa bạn đang học.' }, { status: 403 });

  const { data: result, error } = await getSupabaseAdmin().rpc('transfer_assignment_team_leader', {
    p_team_id: teamId,
    p_assignment_id: assignmentId,
    p_current_leader_id: userId,
    p_new_leader_id: parsed.data.newLeaderId
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const resultError = getTransferLeaderError(String(result));
  if (resultError) return NextResponse.json({ error: resultError }, { status: 409 });
  return NextResponse.json({ data: { status: result } });
}
