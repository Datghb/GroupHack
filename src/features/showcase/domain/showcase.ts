export function canPublishSubmission(
  checkpointIds: string[],
  completedCheckpointIds: string[]
): boolean {
  if (checkpointIds.length === 0) return false;
  const completed = new Set(completedCheckpointIds);
  return checkpointIds.every((checkpointId) => completed.has(checkpointId));
}

interface AssignmentCheckpoint {
  id: string;
  assignmentId: string;
}

interface TeamCheckpointCompletion {
  checkpointId: string;
  assignmentId: string;
  teamId: string;
}

export function canPublishAssignmentProduct({
  assignmentId,
  teamId,
  checkpoints,
  completions
}: {
  assignmentId: string;
  teamId: string;
  checkpoints: AssignmentCheckpoint[];
  completions: TeamCheckpointCompletion[];
}): boolean {
  const assignmentCheckpointIds = checkpoints
    .filter((checkpoint) => checkpoint.assignmentId === assignmentId)
    .map((checkpoint) => checkpoint.id);
  const completedCheckpointIds = completions
    .filter(
      (completion) => completion.assignmentId === assignmentId && completion.teamId === teamId
    )
    .map((completion) => completion.checkpointId);

  return canPublishSubmission(assignmentCheckpointIds, completedCheckpointIds);
}

export function canReviewSubmission(reviewerTeamId: string | null, ownerTeamId: string): boolean {
  return Boolean(reviewerTeamId && reviewerTeamId !== ownerTeamId);
}

export function calculateRatingSummary(ratings: number[]): {
  average: number;
  count: number;
} {
  if (ratings.length === 0) return { average: 0, count: 0 };
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return { average: Math.round((total / ratings.length) * 10) / 10, count: ratings.length };
}

export function calculateRubricRating(scores: number[]): number {
  if (scores.length === 0) throw new Error('Cần ít nhất một tiêu chí đánh giá.');
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round((total / scores.length) * 10) / 10;
}
