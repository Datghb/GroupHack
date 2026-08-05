import { describe, expect, it } from 'vitest';
import { buildTeacherOverviewData } from './teacher-overview';

describe('buildTeacherOverviewData', () => {
  it('preserves totals while returning progress for only the latest eight assignments', () => {
    const assignments = Array.from({ length: 10 }, (_, index) => ({
      id: `assignment-${index}`,
      title: `Bài tập ${index}`,
      classroom_id: index === 0 ? 'missing-class' : 'class-1'
    }));

    const data = buildTeacherOverviewData({
      classes: [{ id: 'class-1', name: 'Lớp 1' }],
      enrollments: [
        { student_id: 'student-1' },
        { student_id: 'student-1' },
        { student_id: 'student-2' }
      ],
      assignmentCount: assignments.length,
      recentAssignments: assignments,
      teams: [{ id: 'team-1' }, { id: 'team-2' }],
      checkpoints: [
        { assignment_id: 'assignment-0' },
        { assignment_id: 'assignment-0' },
        { assignment_id: 'assignment-8' }
      ],
      completions: [
        { assignment_id: 'assignment-0', team_id: 'team-1' },
        { assignment_id: 'assignment-0', team_id: 'team-1' },
        { assignment_id: 'assignment-0', team_id: 'team-2' },
        { assignment_id: 'assignment-8', team_id: 'team-3' }
      ]
    });

    expect(data).toMatchObject({
      classCount: 1,
      studentCount: 2,
      teamCount: 2,
      assignmentCount: 10
    });
    expect(data.assignments).toHaveLength(8);
    expect(data.assignments[0]).toEqual({
      id: 'assignment-0',
      classId: 'missing-class',
      title: 'Bài tập 0',
      className: 'Lớp học',
      totalCheckpoints: 2,
      activeTeamCount: 2
    });
    expect(data.assignments.some((assignment) => assignment.id === 'assignment-8')).toBe(false);
  });
});
