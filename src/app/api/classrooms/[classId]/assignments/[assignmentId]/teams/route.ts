import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { canAccessAssignment } from '@/lib/classroom-access';
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).default(''),
  capacity: z.number().int().min(2).max(10)
});
interface UserSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}
interface TeamRow {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  capacity: number;
  open: boolean;
}
interface MemberRow {
  team_id: string;
  student_id: string;
}
interface RequestRow {
  id: string;
  team_id: string;
  student_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}
const mapTeam = (
  team: TeamRow,
  members: MemberRow[],
  users: Map<string, UserSummary>,
  requests: RequestRow[] = [],
  submittedTeamIds: Set<string> = new Set(),
  currentUserId?: string
) => ({
  id: team.id,
  name: team.name,
  description: team.description,
  leaderId: team.leader_id,
  capacity: team.capacity,
  open: team.open,
  hasSubmission: submittedTeamIds.has(team.id),
  memberIds: members.filter((item) => item.team_id === team.id).map((item) => item.student_id),
  members: members
    .filter((item) => item.team_id === team.id)
    .map(
      (item) =>
        users.get(item.student_id) ?? {
          id: item.student_id,
          fullName: 'Thành viên',
          avatarUrl: null
        }
    ),
  myRequestStatus:
    requests.find((item) => item.team_id === team.id && item.student_id === currentUserId)
      ?.status ?? null,
  joinRequests:
    team.leader_id === currentUserId
      ? requests
          .filter((item) => item.team_id === team.id && item.status === 'PENDING')
          .map((item) => ({
            id: item.id,
            student: users.get(item.student_id) ?? {
              id: item.student_id,
              fullName: 'Học sinh',
              avatarUrl: null
            },
            createdAt: item.created_at
          }))
      : []
});
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string; assignmentId: string }> }
) {
  const [{ userId, role }, { classId, assignmentId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (!(await canAccessAssignment(userId, role, classId, assignmentId)))
    return NextResponse.json(
      { error: 'Bạn không có quyền xem nhóm của bài tập này.' },
      { status: 403 }
    );
  const db = getSupabaseAdmin();
  const { data: teams, error } = await db
    .from('assignment_teams')
    .select('*')
    .eq('classroom_id', classId)
    .eq('assignment_id', assignmentId)
    .order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (teams ?? []).map((item) => item.id);
  const [{ data: members }, { data: requests }, { data: submissions }] = ids.length
    ? await Promise.all([
        db.from('assignment_team_members').select('*').in('team_id', ids),
        db
          .from('assignment_team_join_requests')
          .select('id,team_id,student_id,status,created_at')
          .in('team_id', ids),
        db.from('product_submissions').select('team_id').eq('assignment_id', assignmentId)
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const memberIds = [
    ...new Set([
      ...(members ?? []).map((item) => item.student_id),
      ...(requests ?? []).map((item) => item.student_id)
    ])
  ];
  const { data: authUsers } = memberIds.length
    ? await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
    : { data: { users: [] } };
  const users = new Map(
    authUsers.users
      .filter((authUser) => memberIds.includes(authUser.id))
      .map((authUser) => [
        authUser.id,
        {
          id: authUser.id,
          fullName:
            authUser.user_metadata.full_name ||
            authUser.user_metadata.name ||
            authUser.email ||
            'Thành viên',
          avatarUrl: authUser.user_metadata.avatar_url || authUser.user_metadata.picture || null
        }
      ])
  );
  return NextResponse.json({
    data: (teams ?? []).map((team) =>
      mapTeam(
        team,
        members ?? [],
        users,
        requests ?? [],
        new Set((submissions ?? []).map((submission) => submission.team_id)),
        userId
      )
    )
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
  if (!(await canAccessAssignment(userId, role, classId, assignmentId)))
    return NextResponse.json({ error: 'Bài tập không thuộc khóa bạn đang học.' }, { status: 403 });
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
    {
      data: mapTeam(
        team,
        [{ team_id: team.id, student_id: userId }],
        new Map([[userId, { id: userId, fullName: 'Bạn', avatarUrl: null }]])
      )
    },
    { status: 201 }
  );
}
