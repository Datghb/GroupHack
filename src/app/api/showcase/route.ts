import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getCheckpointCompletionState } from '@/features/classroom/domain/checkpoint-completion';
import {
  calculateRatingSummary,
  canPublishAssignmentProduct
} from '@/features/showcase/domain/showcase';

const submissionSchema = z.object({
  assignmentId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000),
  websiteUrl: z
    .string()
    .trim()
    .url()
    .max(2048)
    .refine((url) => /^https?:\/\//i.test(url))
});

export async function GET() {
  const { userId, role } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const db = getSupabaseAdmin();
  const { data: classrooms } =
    role === 'TEACHER'
      ? await db.from('classrooms').select('id,name').eq('teacher_id', userId).eq('archived', false)
      : await db
          .from('class_enrollments')
          .select('classrooms!inner(id,name)')
          .eq('student_id', userId);
  const classRows = (classrooms ?? []).map((row) => {
    const classroom =
      'classrooms' in row ? (row.classrooms as unknown as { id: string; name: string }) : row;
    return { id: classroom.id, name: classroom.name };
  });
  const classIds = classRows.map((item) => item.id);
  if (!classIds.length)
    return NextResponse.json({
      data: {
        canSubmit: role === 'STUDENT',
        canEvaluate: true,
        submissions: [],
        publishableAssignments: [],
        manageableAssignments: []
      }
    });

  const { data: assignments, error: assignmentError } = await db
    .from('assignments')
    .select('id,title,classroom_id')
    .in('classroom_id', classIds);
  if (assignmentError)
    return NextResponse.json({ error: assignmentError.message }, { status: 500 });
  const assignmentIds = (assignments ?? []).map((item) => item.id);
  const [{ data: submissions }, { data: memberships }, { data: criteria }] = await Promise.all([
    assignmentIds.length
      ? db
          .from('product_submissions')
          .select('*')
          .in('assignment_id', assignmentIds)
          .order('updated_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    role === 'STUDENT' && assignmentIds.length
      ? db
          .from('assignment_team_members')
          .select('assignment_id,team_id,assignment_teams!inner(name)')
          .eq('student_id', userId)
          .in('assignment_id', assignmentIds)
      : Promise.resolve({ data: [] }),
    assignmentIds.length
      ? db
          .from('assignment_review_criteria')
          .select('id,assignment_id,title,description,position')
          .in('assignment_id', assignmentIds)
          .order('position')
      : Promise.resolve({ data: [] })
  ]);
  const teamIds = Array.from(
    new Set([
      ...(submissions ?? []).map((item) => item.team_id),
      ...(memberships ?? []).map((item) => item.team_id)
    ])
  );
  const submissionIds = (submissions ?? []).map((item) => item.id);
  const myTeamIds = (memberships ?? []).map((item) => item.team_id);
  const [
    { data: teams },
    { data: reviews },
    { data: reviewScoreRows },
    { data: discussionComments },
    { data: checkpoints },
    { data: completions },
    { data: members }
  ] = await Promise.all([
    teamIds.length
      ? db.from('assignment_teams').select('id,name').in('id', teamIds)
      : Promise.resolve({ data: [] }),
    submissionIds.length
      ? db
          .from('product_reviews')
          .select('id,submission_id,reviewer_team_id,reviewer_id,rating,created_at')
          .in('submission_id', submissionIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    submissionIds.length
      ? db
          .from('product_review_scores')
          .select('review_id,criterion_id,score,product_reviews!inner(submission_id)')
          .in('product_reviews.submission_id', submissionIds)
      : Promise.resolve({ data: [] }),
    submissionIds.length
      ? db
          .from('product_discussion_comments')
          .select('id,submission_id')
          .in('submission_id', submissionIds)
      : Promise.resolve({ data: [] }),
    role === 'STUDENT' && assignmentIds.length
      ? db
          .from('assignment_checkpoints')
          .select('id,assignment_id,scope')
          .in('assignment_id', assignmentIds)
      : Promise.resolve({ data: [] }),
    role === 'STUDENT' && myTeamIds.length
      ? db
          .from('checkpoint_completions')
          .select('checkpoint_id,assignment_id,team_id,completed_by,completion_scope')
          .in('team_id', myTeamIds)
      : Promise.resolve({ data: [] }),
    role === 'STUDENT' && myTeamIds.length
      ? db.from('assignment_team_members').select('team_id,student_id').in('team_id', myTeamIds)
      : Promise.resolve({ data: [] })
  ]);
  const reviewScores = (reviewScoreRows ?? []).map((score) => ({
    review_id: score.review_id,
    criterion_id: score.criterion_id,
    score: score.score
  }));
  const mappedSubmissions = (submissions ?? []).map((submission) => {
    const assignment = (assignments ?? []).find((item) => item.id === submission.assignment_id)!;
    const myTeam = (memberships ?? []).find(
      (item) => item.assignment_id === submission.assignment_id
    );
    const submissionReviews = (reviews ?? []).filter(
      (item) => item.submission_id === submission.id
    );
    const summary = calculateRatingSummary(submissionReviews.map((item) => item.rating));
    const submissionReviewIds = new Set(submissionReviews.map((review) => review.id));
    const submissionCriteria = (criteria ?? [])
      .filter((criterion) => criterion.assignment_id === submission.assignment_id)
      .map((criterion) => ({
        id: criterion.id,
        assignmentId: criterion.assignment_id,
        title: criterion.title,
        description: criterion.description,
        position: criterion.position
      }));
    const mappedReviews = submissionReviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      createdAt: review.created_at,
      scores: (reviewScores ?? [])
        .filter((score) => score.review_id === review.id)
        .map((score) => ({
          criterionId: score.criterion_id,
          score: score.score
        }))
    }));
    const myReviewRow =
      role === 'TEACHER'
        ? submissionReviews.find(
            (review) => review.reviewer_id === userId && !review.reviewer_team_id
          )
        : submissionReviews.find((review) => review.reviewer_team_id === myTeam?.team_id);
    return {
      id: submission.id,
      assignmentId: submission.assignment_id,
      assignmentTitle: assignment.title,
      classroomName:
        classRows.find((item) => item.id === assignment.classroom_id)?.name ?? 'Lớp học',
      teamId: submission.team_id,
      teamName: (teams ?? []).find((team) => team.id === submission.team_id)?.name ?? 'Nhóm',
      title: submission.title,
      description: submission.description,
      websiteUrl: submission.website_url,
      submittedAt: submission.updated_at,
      ratingAverage: summary.average,
      ratingCount: summary.count,
      canReview:
        role === 'TEACHER' ||
        (role === 'STUDENT' && Boolean(myTeam) && myTeam?.team_id !== submission.team_id),
      canEdit: role === 'STUDENT' && myTeam?.team_id === submission.team_id,
      myReview: mappedReviews.find((review) => review.id === myReviewRow?.id) ?? null,
      criteria: submissionCriteria,
      criterionSummaries: submissionCriteria.map((criterion) => {
        const scores = (reviewScores ?? [])
          .filter(
            (score) =>
              submissionReviewIds.has(score.review_id) && score.criterion_id === criterion.id
          )
          .map((score) => score.score);
        return { criterionId: criterion.id, ...calculateRatingSummary(scores) };
      }),
      commentCount: (discussionComments ?? []).filter(
        (comment) => comment.submission_id === submission.id
      ).length
    };
  });

  const publishableAssignments = [];
  if (role === 'STUDENT' && memberships?.length) {
    for (const membership of memberships) {
      const checkpointRows = (checkpoints ?? []).filter(
        (item) => item.assignment_id === membership.assignment_id
      );
      const completedIds = getCheckpointCompletionState({
        checkpoints: checkpointRows.map((item) => ({
          id: item.id,
          scope: item.scope as 'INDIVIDUAL' | 'TEAM'
        })),
        completions: (completions ?? [])
          .filter((item) => item.team_id === membership.team_id)
          .map((item) => ({
            checkpoint_id: item.checkpoint_id,
            completed_by: item.completed_by,
            completion_scope: item.completion_scope as 'INDIVIDUAL' | 'TEAM'
          })),
        memberIds: (members ?? [])
          .filter((item) => item.team_id === membership.team_id)
          .map((item) => item.student_id),
        currentUserId: userId
      }).completedCheckpointIds;
      if (
        canPublishAssignmentProduct({
          assignmentId: membership.assignment_id,
          teamId: membership.team_id,
          checkpoints: checkpointRows.map((item) => ({
            id: item.id,
            assignmentId: item.assignment_id
          })),
          completions: completedIds.map((checkpointId) => ({
            checkpointId,
            assignmentId: membership.assignment_id,
            teamId: membership.team_id
          }))
        })
      ) {
        publishableAssignments.push({
          assignmentId: membership.assignment_id,
          assignmentTitle:
            (assignments ?? []).find((item) => item.id === membership.assignment_id)?.title ??
            'Bài tập',
          teamId: membership.team_id,
          teamName: (teams ?? []).find((team) => team.id === membership.team_id)?.name ?? 'Nhóm',
          existingSubmissionId:
            (submissions ?? []).find(
              (item) =>
                item.assignment_id === membership.assignment_id &&
                item.team_id === membership.team_id
            )?.id ?? null
        });
      }
    }
  }
  return NextResponse.json({
    data: {
      canSubmit: role === 'STUDENT',
      canEvaluate: true,
      submissions: mappedSubmissions,
      publishableAssignments,
      manageableAssignments:
        role === 'TEACHER'
          ? (assignments ?? []).map((assignment) => ({
              assignmentId: assignment.id,
              assignmentTitle: assignment.title,
              classroomName:
                classRows.find((item) => item.id === assignment.classroom_id)?.name ?? 'Lớp học',
              criteria: (criteria ?? [])
                .filter((criterion) => criterion.assignment_id === assignment.id)
                .map((criterion) => ({
                  id: criterion.id,
                  assignmentId: criterion.assignment_id,
                  title: criterion.title,
                  description: criterion.description,
                  position: criterion.position
                }))
            }))
          : []
    }
  });
}

export async function POST(request: Request) {
  const { userId, role } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'STUDENT')
    return NextResponse.json({ error: 'Chỉ học viên được đăng sản phẩm.' }, { status: 403 });
  const parsed = submissionSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Thông tin sản phẩm không hợp lệ.' }, { status: 400 });
  const db = getSupabaseAdmin();
  const { data: membership } = await db
    .from('assignment_team_members')
    .select('team_id')
    .eq('assignment_id', parsed.data.assignmentId)
    .eq('student_id', userId)
    .maybeSingle();
  if (!membership)
    return NextResponse.json({ error: 'Bạn chưa thuộc nhóm của bài tập này.' }, { status: 403 });
  const [{ data: checkpoints }, { data: completions }, { data: members }] = await Promise.all([
    db
      .from('assignment_checkpoints')
      .select('id,scope')
      .eq('assignment_id', parsed.data.assignmentId),
    db
      .from('checkpoint_completions')
      .select('checkpoint_id,completed_by,completion_scope')
      .eq('assignment_id', parsed.data.assignmentId)
      .eq('team_id', membership.team_id),
    db.from('assignment_team_members').select('student_id').eq('team_id', membership.team_id)
  ]);
  const completedIds = getCheckpointCompletionState({
    checkpoints: (checkpoints ?? []).map((item) => ({
      id: item.id,
      scope: item.scope as 'INDIVIDUAL' | 'TEAM'
    })),
    completions: (completions ?? []).map((item) => ({
      ...item,
      completion_scope: item.completion_scope as 'INDIVIDUAL' | 'TEAM'
    })),
    memberIds: (members ?? []).map((item) => item.student_id),
    currentUserId: userId
  }).completedCheckpointIds;
  if (
    !canPublishAssignmentProduct({
      assignmentId: parsed.data.assignmentId,
      teamId: membership.team_id,
      checkpoints: (checkpoints ?? []).map((item) => ({
        id: item.id,
        assignmentId: parsed.data.assignmentId
      })),
      completions: completedIds.map((checkpointId) => ({
        checkpointId,
        assignmentId: parsed.data.assignmentId,
        teamId: membership.team_id
      }))
    })
  )
    return NextResponse.json(
      { error: 'Nhóm cần hoàn thành tất cả checkpoint trước khi đăng.' },
      { status: 409 }
    );
  const { data, error } = await db
    .from('product_submissions')
    .upsert(
      {
        assignment_id: parsed.data.assignmentId,
        team_id: membership.team_id,
        title: parsed.data.title,
        description: parsed.data.description,
        website_url: parsed.data.websiteUrl,
        submitted_by: userId,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'assignment_id,team_id' }
    )
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
