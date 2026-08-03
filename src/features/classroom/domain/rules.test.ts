import { describe, expect, it } from 'vitest';
import { assignment, classrooms, teams } from '../api/data';
import { calculateOverallProgress, deriveProgressStatus, deriveTeamHealth } from './progress';
import {
  assertCanEditClass,
  assertCanSubmitTeamCheckpoint,
  assertCanUpdatePersonalProgress,
  joinClassroom,
  joinTeam
} from './rules';
import type { ClassroomUser, ProgressRecord, Team } from './types';

const student: ClassroomUser = { id: 'student-new', name: 'Sinh viên mới', role: 'STUDENT' };

describe('class enrollment', () => {
  it('allows a student to join an active class', () => {
    expect(joinClassroom(student, classrooms[0], [])).toContainEqual({
      classroomId: 'web-2026',
      studentId: student.id
    });
  });

  it('prevents duplicate enrollment', () => {
    expect(() =>
      joinClassroom(student, classrooms[0], [{ classroomId: 'web-2026', studentId: student.id }])
    ).toThrow('đã tham gia');
  });
});

describe('team membership', () => {
  it('prevents membership in two teams from the same class', () => {
    const existing = { ...teams[1], memberIds: [student.id] };
    expect(() => joinTeam(student.id, teams[0], [existing])).toThrow('một nhóm');
  });

  it('prevents joining a full team', () => {
    const full: Team = { ...teams[0], memberIds: ['1', '2'], capacity: 2 };
    expect(() => joinTeam(student.id, full, [])).toThrow('đủ thành viên');
  });

  it('only permits the leader to submit a team checkpoint', () => {
    expect(() => assertCanSubmitTeamCheckpoint('student-2', teams[0])).toThrow('trưởng nhóm');
  });
});

describe('authorization', () => {
  it('prevents updating another student personal checkpoint', () => {
    const progress: ProgressRecord = { checkpointId: 'cp-1', ownerId: 'student-2', percentage: 20 };
    expect(() =>
      assertCanUpdatePersonalProgress('student-1', progress, assignment.checkpoints[0])
    ).toThrow('người khác');
  });

  it("prevents a teacher editing another teacher's class", () => {
    expect(() => assertCanEditClass('teacher-2', classrooms[0])).toThrow('không sở hữu');
  });
});

describe('progress calculations', () => {
  it('becomes late after due time', () => {
    const checkpoint = {
      ...assignment.checkpoints[2],
      opensAt: new Date('2026-01-01'),
      dueAt: new Date('2026-01-02'),
      closesAt: new Date('2026-01-04')
    };
    expect(deriveProgressStatus(checkpoint, undefined, new Date('2026-01-03'))).toBe('LATE');
  });

  it('becomes missed after closing time', () => {
    const checkpoint = { ...assignment.checkpoints[2], closesAt: new Date('2026-01-04') };
    expect(deriveProgressStatus(checkpoint, undefined, new Date('2026-01-05'))).toBe('MISSED');
  });

  it('calculates overall assignment progress', () => {
    expect(
      calculateOverallProgress(
        [
          { checkpointId: '1', ownerId: 'team', percentage: 100 },
          { checkpointId: '2', ownerId: 'team', percentage: 50 }
        ],
        2
      )
    ).toBe(75);
  });

  it('derives late and inactive team health consistently', () => {
    const base = {
      assignment,
      progress: 50,
      completedCheckpoints: 1,
      now: new Date(),
      lastActivityAt: new Date()
    };
    expect(deriveTeamHealth({ ...base, lateCheckpoints: 1 })).toBe('LATE');
    expect(
      deriveTeamHealth({
        ...base,
        lateCheckpoints: 0,
        lastActivityAt: new Date(Date.now() - 8 * 86_400_000)
      })
    ).toBe('INACTIVE');
  });
});
