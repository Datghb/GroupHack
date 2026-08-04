import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiAuth } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { calculateRubricRating, canReviewSubmission } from '@/features/showcase/domain/showcase';

const reviewSchema = z.object({
  scores: z
    .array(z.object({ criterionId: z.string().uuid(), score: z.number().int().min(1).max(5) }))
    .min(1)
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const [{ userId, role }, { submissionId }] = await Promise.all([getApiAuth(), params]);
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'Điểm hoặc nhận xét không hợp lệ.' }, { status: 400 });
  const db = getSupabaseAdmin();
  const { data: submission } = await db
    .from('product_submissions')
    .select('id,assignment_id,team_id,assignments!inner(review_mode)')
    .eq('id', submissionId)
    .maybeSingle();
  if (!submission) return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });
  const assignmentReviewMode = (submission.assignments as unknown as { review_mode: string })
    .review_mode;
  const reviewMode = assignmentReviewMode === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'TEAM';
  let reviewerTeamId: string | null = null;
  if (role === 'TEACHER') {
    const { data: accessibleAssignment } = await db
      .from('assignments')
      .select('id,classrooms!inner(archived)')
      .eq('id', submission.assignment_id)
      .eq('classrooms.archived', false)
      .maybeSingle();
    if (!accessibleAssignment)
      return NextResponse.json(
        { error: 'Bạn không thể đánh giá sản phẩm của lớp này.' },
        { status: 403 }
      );
  } else {
    const { data: membership } = await db
      .from('assignment_team_members')
      .select('team_id')
      .eq('assignment_id', submission.assignment_id)
      .eq('student_id', userId)
      .maybeSingle();
    reviewerTeamId = membership?.team_id ?? null;
    if (!canReviewSubmission(reviewerTeamId, submission.team_id))
      return NextResponse.json(
        { error: 'Nhóm không thể tự đánh giá sản phẩm của mình.' },
        { status: 403 }
      );
  }
  const { data: criteria, error: criteriaError } = await db
    .from('assignment_review_criteria')
    .select('id')
    .eq('assignment_id', submission.assignment_id);
  if (criteriaError) return NextResponse.json({ error: criteriaError.message }, { status: 500 });
  const criterionIds = (criteria ?? []).map((criterion) => criterion.id);
  const submittedIds = parsed.data.scores.map((score) => score.criterionId);
  if (
    criterionIds.length === 0 ||
    criterionIds.length !== new Set(submittedIds).size ||
    !criterionIds.every((criterionId) => submittedIds.includes(criterionId))
  )
    return NextResponse.json(
      { error: 'Bạn cần chấm đầy đủ các tiêu chí do giảng viên thiết lập.' },
      { status: 400 }
    );
  const rating = calculateRubricRating(parsed.data.scores.map((item) => item.score));
  let existingReviewQuery = db
    .from('product_reviews')
    .select('id')
    .eq('submission_id', submissionId);
  existingReviewQuery = reviewerTeamId
    ? reviewMode === 'INDIVIDUAL'
      ? existingReviewQuery.eq('reviewer_id', userId).not('reviewer_team_id', 'is', null)
      : existingReviewQuery.eq('reviewer_team_id', reviewerTeamId).eq('review_mode', 'TEAM')
    : existingReviewQuery.eq('reviewer_id', userId).is('reviewer_team_id', null);
  const { data: existingReview, error: lookupError } = await existingReviewQuery.maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  const reviewValues = {
    submission_id: submissionId,
    reviewer_team_id: reviewerTeamId,
    reviewer_id: userId,
    review_mode: reviewMode,
    rating,
    comment: '',
    updated_at: new Date().toISOString()
  };
  const { data, error } = existingReview
    ? await db
        .from('product_reviews')
        .update({
          reviewer_id: reviewValues.reviewer_id,
          review_mode: reviewValues.review_mode,
          rating: reviewValues.rating,
          comment: reviewValues.comment,
          updated_at: reviewValues.updated_at
        })
        .eq('id', existingReview.id)
        .select('id')
        .single()
    : await db
        .from('product_reviews')
        .insert({
          submission_id: submissionId,
          reviewer_team_id: reviewValues.reviewer_team_id,
          reviewer_id: reviewValues.reviewer_id,
          review_mode: reviewValues.review_mode,
          rating: reviewValues.rating,
          comment: reviewValues.comment,
          updated_at: reviewValues.updated_at
        })
        .select('id')
        .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { error: deleteError } = await db
    .from('product_review_scores')
    .delete()
    .eq('review_id', data.id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  const { error: scoreError } = await db.from('product_review_scores').insert(
    parsed.data.scores.map((score) => ({
      review_id: data.id,
      criterion_id: score.criterionId,
      score: score.score,
      updated_at: new Date().toISOString()
    }))
  );
  if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 });
  return NextResponse.json({ data });
}
