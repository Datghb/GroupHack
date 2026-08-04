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
    .select('id,assignment_id,team_id')
    .eq('id', submissionId)
    .maybeSingle();
  if (!submission) return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });
  let reviewerTeamId: string | null = null;
  if (role === 'TEACHER') {
    const { data: managedAssignment } = await db
      .from('assignments')
      .select('id,classrooms!inner(teacher_id)')
      .eq('id', submission.assignment_id)
      .eq('classrooms.teacher_id', userId)
      .maybeSingle();
    if (!managedAssignment)
      return NextResponse.json(
        { error: 'Bạn không quản lý lớp của sản phẩm này.' },
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
    ? existingReviewQuery.eq('reviewer_team_id', reviewerTeamId)
    : existingReviewQuery.eq('reviewer_id', userId).is('reviewer_team_id', null);
  const { data: existingReview, error: lookupError } = await existingReviewQuery.maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  const reviewValues = {
    submission_id: submissionId,
    reviewer_team_id: reviewerTeamId,
    reviewer_id: userId,
    rating,
    comment: '',
    updated_at: new Date().toISOString()
  };
  const { data, error } = existingReview
    ? await db
        .from('product_reviews')
        .update({
          reviewer_id: reviewValues.reviewer_id,
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
