import { describe, expect, test } from 'vitest';
import { getCheckpointCompletionState } from './checkpoint-completion';

const checkpoints = [
  { id: 'cp-team', scope: 'TEAM' as const },
  { id: 'cp-personal', scope: 'INDIVIDUAL' as const }
];

describe('trạng thái hoàn thành checkpoint', () => {
  test('checkpoint nhóm chỉ hoàn thành khi mọi thành viên đã tick', () => {
    const partialState = getCheckpointCompletionState({
      checkpoints,
      completions: [
        {
          checkpoint_id: 'cp-team',
          completed_by: 'student-1',
          completion_scope: 'TEAM'
        }
      ],
      memberIds: ['student-1', 'student-2'],
      currentUserId: 'student-2'
    });

    expect(partialState.completedCheckpointIds).not.toContain('cp-team');
    expect(partialState.myCompletedCheckpointIds).not.toContain('cp-team');

    const completedState = getCheckpointCompletionState({
      checkpoints,
      completions: [
        {
          checkpoint_id: 'cp-team',
          completed_by: 'student-1',
          completion_scope: 'TEAM'
        },
        {
          checkpoint_id: 'cp-team',
          completed_by: 'student-2',
          completion_scope: 'INDIVIDUAL'
        }
      ],
      memberIds: ['student-1', 'student-2'],
      currentUserId: 'student-2'
    });

    expect(completedState.completedCheckpointIds).toContain('cp-team');
    expect(completedState.myCompletedCheckpointIds).toContain('cp-team');
  });

  test('chấp nhận dữ liệu lượt tick mới và dữ liệu scope cũ trong cùng checkpoint', () => {
    const state = getCheckpointCompletionState({
      checkpoints,
      completions: [
        {
          checkpoint_id: 'cp-team',
          completed_by: 'student-1',
          completion_scope: 'TEAM'
        },
        {
          checkpoint_id: 'cp-team',
          completed_by: 'student-2',
          completion_scope: 'INDIVIDUAL'
        }
      ],
      memberIds: ['student-1', 'student-2'],
      currentUserId: 'student-2'
    });

    expect(state.completedCheckpointIds).toContain('cp-team');
    expect(state.myCompletedCheckpointIds).toContain('cp-team');
  });

  test('checkpoint cá nhân chỉ hoàn thành cho cả nhóm khi mọi người đã làm', () => {
    const firstStudentState = getCheckpointCompletionState({
      checkpoints,
      completions: [
        {
          checkpoint_id: 'cp-personal',
          completed_by: 'student-1',
          completion_scope: 'INDIVIDUAL'
        }
      ],
      memberIds: ['student-1', 'student-2'],
      currentUserId: 'student-1'
    });
    expect(firstStudentState.completedCheckpointIds).not.toContain('cp-personal');
    expect(firstStudentState.myCompletedCheckpointIds).toContain('cp-personal');

    const wholeTeamState = getCheckpointCompletionState({
      checkpoints,
      completions: [
        {
          checkpoint_id: 'cp-personal',
          completed_by: 'student-1',
          completion_scope: 'INDIVIDUAL'
        },
        {
          checkpoint_id: 'cp-personal',
          completed_by: 'student-2',
          completion_scope: 'INDIVIDUAL'
        }
      ],
      memberIds: ['student-1', 'student-2'],
      currentUserId: 'student-2'
    });
    expect(wholeTeamState.completedCheckpointIds).toContain('cp-personal');
  });
});
