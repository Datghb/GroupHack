import { describe, expect, it } from 'vitest';
import {
  calculateRatingSummary,
  calculateRubricRating,
  canPublishAssignmentProduct,
  canPublishSubmission,
  canReviewSubmission,
  isStudentReviewOwner
} from './showcase';

describe('showcase rules', () => {
  it('only allows a team to publish after every checkpoint is complete', () => {
    expect(canPublishSubmission(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(canPublishSubmission(['a', 'b'], ['a'])).toBe(false);
    expect(canPublishSubmission([], [])).toBe(false);
  });

  it('does not allow a team to review its own product', () => {
    expect(canReviewSubmission('team-a', 'team-b')).toBe(true);
    expect(canReviewSubmission('team-a', 'team-a')).toBe(false);
    expect(canReviewSubmission(null, 'team-a')).toBe(false);
  });

  it('only counts checkpoints from the selected assignment and team', () => {
    const checkpoints = [
      { id: 'lesson-a-1', assignmentId: 'lesson-a' },
      { id: 'lesson-a-2', assignmentId: 'lesson-a' },
      { id: 'lesson-b-1', assignmentId: 'lesson-b' }
    ];
    const completions = [
      { checkpointId: 'lesson-a-1', assignmentId: 'lesson-a', teamId: 'team-a' },
      { checkpointId: 'lesson-a-2', assignmentId: 'lesson-a', teamId: 'team-b' },
      { checkpointId: 'lesson-b-1', assignmentId: 'lesson-b', teamId: 'team-a' }
    ];

    expect(
      canPublishAssignmentProduct({
        assignmentId: 'lesson-a',
        teamId: 'team-a',
        checkpoints,
        completions
      })
    ).toBe(false);

    expect(
      canPublishAssignmentProduct({
        assignmentId: 'lesson-b',
        teamId: 'team-a',
        checkpoints,
        completions
      })
    ).toBe(true);
  });

  it('calculates a stable rating summary', () => {
    expect(calculateRatingSummary([5, 4, 4])).toEqual({ average: 4.3, count: 3 });
    expect(calculateRatingSummary([])).toEqual({ average: 0, count: 0 });
  });

  it('calculates the review rating from all rubric scores', () => {
    expect(calculateRubricRating([5, 4, 3])).toBe(4);
    expect(calculateRubricRating([5, 4])).toBe(4.5);
    expect(() => calculateRubricRating([])).toThrow('ít nhất một tiêu chí');
  });

  it('resolves student reviews by team or by individual according to assignment mode', () => {
    const review = { reviewerId: 'student-a', reviewerTeamId: 'team-a' };

    expect(
      isStudentReviewOwner(review, {
        reviewMode: 'TEAM',
        studentId: 'student-b',
        teamId: 'team-a'
      })
    ).toBe(true);
    expect(
      isStudentReviewOwner(review, {
        reviewMode: 'INDIVIDUAL',
        studentId: 'student-b',
        teamId: 'team-a'
      })
    ).toBe(false);
    expect(
      isStudentReviewOwner(review, {
        reviewMode: 'INDIVIDUAL',
        studentId: 'student-a',
        teamId: 'team-a'
      })
    ).toBe(true);
  });
});
