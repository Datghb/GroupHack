import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { canAccessAssignment } from '@/lib/classroom-access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({ action: z.enum(['APPROVE', 'REJECT']) });

export async function PATCH(
  request: Request,
  {
    params
  }: {
    params: Promise<{ classId: string; assignmentId: string; teamId: string; requestId: string }>;
  }
) {
  const [{ userId, role }, values] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (
    role !== 'STUDENT' ||
    !(await canAccessAssignment(userId, role, values.classId, values.assignmentId))
  )
    return NextResponse.json({ error: 'Không có quyền xử lý yêu cầu.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Thao tác không hợp lệ.' }, { status: 400 });
  const db = getSupabaseAdmin();
  const { data: team } = await db
    .from('assignment_teams')
    .select('id')
    .eq('id', values.teamId)
    .eq('assignment_id', values.assignmentId)
    .eq('leader_id', userId)
    .maybeSingle();
  if (!team)
    return NextResponse.json({ error: 'Chỉ trưởng nhóm được xử lý yêu cầu.' }, { status: 403 });
  const { data: result, error } = await db.rpc('review_assignment_team_join_request', {
    p_request_id: values.requestId,
    p_leader_id: userId,
    p_approve: parsed.data.action === 'APPROVE'
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const errors: Record<string, [string, number]> = {
    FORBIDDEN: ['Chỉ trưởng nhóm được xử lý yêu cầu.', 403],
    FULL: ['Nhóm đã đủ thành viên.', 409],
    ALREADY_MEMBER: ['Học sinh đã tham gia một nhóm khác.', 409],
    NOT_PENDING: ['Yêu cầu đã được xử lý hoặc không tồn tại.', 409]
  };
  if (errors[result])
    return NextResponse.json({ error: errors[result][0] }, { status: errors[result][1] });
  return NextResponse.json({ data: { status: result } });
}
