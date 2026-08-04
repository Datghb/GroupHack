import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  content: z.string().trim().min(1).max(1000),
  parentId: z.string().uuid().nullable().optional()
});

async function getContext(submissionId: string) {
  const { userId, role } = await getApiAuth();
  if (!userId) return null;
  const db = getSupabaseAdmin();
  const { data: submission } = await db
    .from('product_submissions')
    .select('id,assignment_id,assignments!inner(id,classroom_id,course_id)')
    .eq('id', submissionId)
    .maybeSingle();
  if (!submission) return null;
  const assignment = submission.assignments as unknown as {
    id: string;
    classroom_id: string;
    course_id: string;
  };
  const { data: access } =
    role === 'TEACHER'
      ? await db
          .from('classrooms')
          .select('id')
          .eq('id', assignment.classroom_id)
          .eq('archived', false)
          .maybeSingle()
      : await db
          .from('class_enrollments')
          .select('id')
          .eq('classroom_id', assignment.classroom_id)
          .eq('course_id', assignment.course_id)
          .eq('student_id', userId)
          .maybeSingle();
  if (!access) return null;
  return { db, userId, role: role ?? 'STUDENT', submission };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const context = await getContext(submissionId);
  if (!context)
    return NextResponse.json({ error: 'Bạn không có quyền xem thảo luận.' }, { status: 403 });
  const { data: comments, error } = await context.db
    .from('product_discussion_comments')
    .select('id,parent_id,author_id,content,created_at')
    .eq('submission_id', submissionId)
    .order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const authorIds = Array.from(new Set((comments ?? []).map((comment) => comment.author_id)));
  const { data: profiles } = authorIds.length
    ? await context.db.from('profiles').select('id,full_name,display_name,role').in('id', authorIds)
    : { data: [] };
  return NextResponse.json({
    data: (comments ?? []).map((comment) => {
      const profile = (profiles ?? []).find((item) => item.id === comment.author_id);
      return {
        id: comment.id,
        parentId: comment.parent_id,
        authorName: profile?.full_name || profile?.display_name || 'Thành viên',
        authorRole: String(profile?.role).toUpperCase() === 'TEACHER' ? 'TEACHER' : 'STUDENT',
        content: comment.content,
        createdAt: comment.created_at,
        isMine: comment.author_id === context.userId
      };
    })
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const context = await getContext(submissionId);
  if (!context)
    return NextResponse.json({ error: 'Bạn không có quyền thảo luận.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Nội dung bình luận không hợp lệ.' }, { status: 400 });
  if (parsed.data.parentId) {
    const { data: parent } = await context.db
      .from('product_discussion_comments')
      .select('id')
      .eq('id', parsed.data.parentId)
      .eq('submission_id', submissionId)
      .maybeSingle();
    if (!parent)
      return NextResponse.json({ error: 'Bình luận được trả lời không tồn tại.' }, { status: 400 });
  }
  const { data, error } = await context.db
    .from('product_discussion_comments')
    .insert({
      submission_id: submissionId,
      author_id: context.userId,
      parent_id: parsed.data.parentId ?? null,
      content: parsed.data.content
    })
    .select('id,parent_id,content,created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: profile } = await context.db
    .from('profiles')
    .select('full_name,display_name')
    .eq('id', context.userId)
    .maybeSingle();
  return NextResponse.json(
    {
      data: {
        id: data.id,
        parentId: data.parent_id,
        authorName: profile?.full_name || profile?.display_name || 'Thành viên',
        authorRole: context.role,
        content: data.content,
        createdAt: data.created_at,
        isMine: true
      }
    },
    { status: 201 }
  );
}
