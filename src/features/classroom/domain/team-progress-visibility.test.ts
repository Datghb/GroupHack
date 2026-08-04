import { describe, expect, it } from 'vitest';
import {
  canViewTeamMemberProgress,
  getVisibleTeamMemberProgress
} from './team-progress-visibility';

describe('canViewTeamMemberProgress', () => {
  it('allows a student to view progress for their own team', () => {
    expect(
      canViewTeamMemberProgress({
        role: 'STUDENT',
        userId: 'student-1',
        memberIds: ['student-1', 'student-2']
      })
    ).toBe(true);
  });

  it('denies students from other teams', () => {
    expect(
      canViewTeamMemberProgress({
        role: 'STUDENT',
        userId: 'student-3',
        memberIds: ['student-1', 'student-2']
      })
    ).toBe(false);
  });

  it('denies teachers and unauthenticated roles', () => {
    expect(
      canViewTeamMemberProgress({
        role: 'TEACHER',
        userId: 'teacher-1',
        memberIds: ['student-1', 'student-2']
      })
    ).toBe(false);

    expect(
      canViewTeamMemberProgress({
        role: null,
        userId: 'unknown',
        memberIds: ['student-1']
      })
    ).toBe(false);
  });

  it('omits the member progress payload when the viewer is not on the team', () => {
    const memberProgress = [{ id: 'student-1', completedCheckpointIds: ['cp-1'] }];

    expect(
      getVisibleTeamMemberProgress({
        role: 'STUDENT',
        userId: 'student-3',
        memberIds: ['student-1'],
        memberProgress
      })
    ).toBeUndefined();

    expect(
      getVisibleTeamMemberProgress({
        role: 'TEACHER',
        userId: 'teacher-1',
        memberIds: ['student-1'],
        memberProgress
      })
    ).toBeUndefined();
  });
});
