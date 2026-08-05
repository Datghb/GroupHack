interface ClassroomIndexRow {
  id: string;
  name: string;
}

interface AssignmentIndexRow {
  id: string;
  classroom_id: string;
}

interface TeamIndexRow {
  id: string;
}

interface MembershipIndexRow {
  assignment_id: string;
  team_id: string;
}

interface SubmissionIndexRow {
  id: string;
  assignment_id: string;
  team_id: string;
}

interface ReviewIndexRow {
  id: string;
  submission_id: string;
}

interface ReviewScoreIndexRow {
  review_id: string;
  criterion_id: string;
  score: number;
}

interface CriterionIndexRow {
  assignment_id: string;
}

interface CommentIndexRow {
  submission_id: string;
}

interface CheckpointIndexRow {
  assignment_id: string;
}

interface CompletionIndexRow {
  team_id: string;
}

interface MemberIndexRow {
  team_id: string;
  student_id: string;
}

interface ShowcaseIndexInput<
  Classroom extends ClassroomIndexRow,
  Assignment extends AssignmentIndexRow,
  Team extends TeamIndexRow,
  Membership extends MembershipIndexRow,
  Submission extends SubmissionIndexRow,
  Review extends ReviewIndexRow,
  ReviewScore extends ReviewScoreIndexRow,
  Criterion extends CriterionIndexRow,
  Comment extends CommentIndexRow,
  Checkpoint extends CheckpointIndexRow,
  Completion extends CompletionIndexRow,
  Member extends MemberIndexRow
> {
  classrooms: readonly Classroom[];
  assignments: readonly Assignment[];
  teams: readonly Team[];
  memberships: readonly Membership[];
  submissions: readonly Submission[];
  reviews: readonly Review[];
  reviewScores: readonly ReviewScore[];
  criteria: readonly Criterion[];
  comments: readonly Comment[];
  checkpoints: readonly Checkpoint[];
  completions: readonly Completion[];
  members: readonly Member[];
}

function firstById<Row extends { id: string }>(rows: readonly Row[]): Map<string, Row> {
  return firstBy(rows, (row) => row.id);
}

function firstBy<Row>(rows: readonly Row[], getKey: (row: Row) => string): Map<string, Row> {
  const indexedRows = new Map<string, Row>();

  for (const row of rows) {
    const key = getKey(row);
    if (!indexedRows.has(key)) indexedRows.set(key, row);
  }

  return indexedRows;
}

function groupBy<Row, Key>(rows: readonly Row[], getKey: (row: Row) => Key): Map<Key, Row[]> {
  const groupedRows = new Map<Key, Row[]>();

  for (const row of rows) {
    const key = getKey(row);
    const group = groupedRows.get(key);
    if (group) group.push(row);
    else groupedRows.set(key, [row]);
  }

  return groupedRows;
}

export function createShowcaseIndexes<
  Classroom extends ClassroomIndexRow,
  Assignment extends AssignmentIndexRow,
  Team extends TeamIndexRow,
  Membership extends MembershipIndexRow,
  Submission extends SubmissionIndexRow,
  Review extends ReviewIndexRow,
  ReviewScore extends ReviewScoreIndexRow,
  Criterion extends CriterionIndexRow,
  Comment extends CommentIndexRow,
  Checkpoint extends CheckpointIndexRow,
  Completion extends CompletionIndexRow,
  Member extends MemberIndexRow
>(
  input: ShowcaseIndexInput<
    Classroom,
    Assignment,
    Team,
    Membership,
    Submission,
    Review,
    ReviewScore,
    Criterion,
    Comment,
    Checkpoint,
    Completion,
    Member
  >
) {
  const reviewById = firstById(input.reviews);
  const scoresBySubmissionAndCriterion = new Map<string, Map<string, number[]>>();
  const submissionByAssignmentAndTeam = new Map<string, Map<string, Submission>>();
  const commentCountBySubmissionId = new Map<string, number>();

  for (const submission of input.submissions) {
    const submissionsByTeam =
      submissionByAssignmentAndTeam.get(submission.assignment_id) ?? new Map<string, Submission>();
    if (!submissionsByTeam.has(submission.team_id)) {
      submissionsByTeam.set(submission.team_id, submission);
      submissionByAssignmentAndTeam.set(submission.assignment_id, submissionsByTeam);
    }
  }

  for (const comment of input.comments) {
    commentCountBySubmissionId.set(
      comment.submission_id,
      (commentCountBySubmissionId.get(comment.submission_id) ?? 0) + 1
    );
  }

  for (const score of input.reviewScores) {
    const submissionId = reviewById.get(score.review_id)?.submission_id;
    if (!submissionId) continue;

    const scoresByCriterion =
      scoresBySubmissionAndCriterion.get(submissionId) ?? new Map<string, number[]>();
    const criterionScores = scoresByCriterion.get(score.criterion_id);
    if (criterionScores) criterionScores.push(score.score);
    else scoresByCriterion.set(score.criterion_id, [score.score]);
    scoresBySubmissionAndCriterion.set(submissionId, scoresByCriterion);
  }

  return {
    classroomById: firstById(input.classrooms),
    assignmentById: firstById(input.assignments),
    teamById: firstById(input.teams),
    membershipByAssignmentId: firstBy(input.memberships, (membership) => membership.assignment_id),
    reviewsBySubmissionId: groupBy(input.reviews, (review) => review.submission_id),
    reviewScoresByReviewId: groupBy(input.reviewScores, (score) => score.review_id),
    criteriaByAssignmentId: groupBy(input.criteria, (criterion) => criterion.assignment_id),
    scoresBySubmissionAndCriterion,
    commentCountBySubmissionId,
    checkpointsByAssignmentId: groupBy(input.checkpoints, (checkpoint) => checkpoint.assignment_id),
    completionsByTeamId: groupBy(input.completions, (completion) => completion.team_id),
    memberIdsByTeamId: new Map(
      Array.from(
        groupBy(input.members, (member) => member.team_id),
        ([teamId, rows]) => [teamId, rows.map((member) => member.student_id)]
      )
    ),
    submissionByAssignmentAndTeam
  };
}
