import { describe, expect, it } from 'vitest';
import { createShowcaseIndexes } from './showcase-indexes';

describe('createShowcaseIndexes', () => {
  it('builds stable lookup and grouping indexes without changing source order', () => {
    const firstMembership = { assignment_id: 'assignment-1', team_id: 'team-1' };
    const firstSubmission = {
      id: 'submission-1',
      assignment_id: 'assignment-1',
      team_id: 'team-1'
    };
    const indexes = createShowcaseIndexes({
      classrooms: [
        { id: 'class-1', name: 'Lop mot', teacherId: 'teacher-1' },
        { id: 'class-1', name: 'Lop trung', teacherId: 'teacher-2' }
      ],
      assignments: [
        {
          id: 'assignment-1',
          title: 'Bai mot',
          classroom_id: 'class-1',
          review_mode: 'TEAM'
        }
      ],
      teams: [{ id: 'team-1', name: 'Nhom mot' }],
      memberships: [firstMembership, { assignment_id: 'assignment-1', team_id: 'team-duplicate' }],
      submissions: [
        firstSubmission,
        { id: 'submission-duplicate', assignment_id: 'assignment-1', team_id: 'team-1' }
      ],
      reviews: Object.freeze([
        {
          id: 'review-2',
          submission_id: 'submission-1',
          reviewer_team_id: 'team-3',
          reviewer_id: 'student-3',
          rating: 2,
          created_at: '2026-08-02T00:00:00.000Z'
        },
        {
          id: 'review-1',
          submission_id: 'submission-1',
          reviewer_team_id: 'team-2',
          reviewer_id: 'student-2',
          rating: 4,
          created_at: '2026-08-01T00:00:00.000Z'
        }
      ]),
      reviewScores: [
        { review_id: 'review-1', criterion_id: 'criterion-1', score: 4 },
        { review_id: 'review-2', criterion_id: 'criterion-1', score: 2 },
        { review_id: 'missing-review', criterion_id: 'criterion-1', score: 5 }
      ],
      criteria: [
        {
          id: 'criterion-2',
          assignment_id: 'assignment-1',
          title: 'Tieu chi hai',
          description: null,
          position: 2
        },
        {
          id: 'criterion-1',
          assignment_id: 'assignment-1',
          title: 'Tieu chi mot',
          description: null,
          position: 1
        }
      ],
      comments: [
        { id: 'comment-1', submission_id: 'submission-1' },
        { id: 'comment-2', submission_id: 'submission-1' }
      ],
      checkpoints: [
        { id: 'checkpoint-1', assignment_id: 'assignment-1', scope: 'TEAM' },
        { id: 'checkpoint-2', assignment_id: 'assignment-1', scope: 'INDIVIDUAL' }
      ],
      completions: [
        {
          checkpoint_id: 'checkpoint-1',
          assignment_id: 'assignment-1',
          team_id: 'team-1',
          completed_by: 'student-1',
          completion_scope: 'TEAM'
        }
      ],
      members: [
        { team_id: 'team-1', student_id: 'student-1' },
        { team_id: 'team-1', student_id: 'student-2' }
      ]
    });

    expect(indexes.classroomById.get('class-1')?.name).toBe('Lop mot');
    expect(indexes.membershipByAssignmentId.get('assignment-1')).toBe(firstMembership);
    expect(indexes.reviewsBySubmissionId.get('submission-1')?.map((review) => review.id)).toEqual([
      'review-2',
      'review-1'
    ]);
    expect(indexes.criteriaByAssignmentId.get('assignment-1')?.map((item) => item.id)).toEqual([
      'criterion-2',
      'criterion-1'
    ]);
    expect(indexes.reviewScoresByReviewId.get('review-1')).toEqual([
      { review_id: 'review-1', criterion_id: 'criterion-1', score: 4 }
    ]);
    expect(indexes.scoresBySubmissionAndCriterion.get('submission-1')?.get('criterion-1')).toEqual([
      4, 2
    ]);
    expect(indexes.commentCountBySubmissionId.get('submission-1')).toBe(2);
    expect(indexes.checkpointsByAssignmentId.get('assignment-1')).toHaveLength(2);
    expect(indexes.completionsByTeamId.get('team-1')).toHaveLength(1);
    expect(indexes.memberIdsByTeamId.get('team-1')).toEqual(['student-1', 'student-2']);
    expect(indexes.submissionByAssignmentAndTeam.get('assignment-1')?.get('team-1')).toBe(
      firstSubmission
    );
  });

  it('returns empty collections for missing lookup keys', () => {
    const indexes = createShowcaseIndexes({
      classrooms: [],
      assignments: [],
      teams: [],
      memberships: [],
      submissions: [],
      reviews: [],
      reviewScores: [],
      criteria: [],
      comments: [],
      checkpoints: [],
      completions: [],
      members: []
    });

    expect(indexes.reviewsBySubmissionId.get('missing')).toBeUndefined();
    expect(indexes.commentCountBySubmissionId.get('missing')).toBeUndefined();
    expect(indexes.submissionByAssignmentAndTeam.get('missing')).toBeUndefined();
  });
});
