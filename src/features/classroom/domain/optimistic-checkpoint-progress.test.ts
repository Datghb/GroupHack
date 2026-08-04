import { describe, expect, it } from 'vitest';
import type { TeamProgressRecord } from '../api/assignment-types';
import { updateMyCheckpointCompletion } from './optimistic-checkpoint-progress';

const progress: TeamProgressRecord[] = [
  {
    id: 'team-1',
    name: 'Nhóm 1',
    leaderId: 'student-1',
    memberIds: ['student-1', 'student-2'],
    completedCheckpointIds: [],
    myCompletedCheckpointIds: [],
    memberProgress: [
      {
        id: 'student-1',
        fullName: 'An',
        avatarUrl: null,
        completedCheckpointIds: []
      }
    ],
    completedCheckpoints: 0,
    totalCheckpoints: 1,
    currentCheckpoint: 'Checkpoint 1',
    progress: 0,
    lateCheckpoints: 0,
    lastActivityAt: null
  }
];

describe('updateMyCheckpointCompletion', () => {
  it('updates the current member immediately without mutating cached data', () => {
    const updated = updateMyCheckpointCompletion(progress, {
      teamId: 'team-1',
      userId: 'student-1',
      checkpointId: 'cp-1',
      completed: true
    });

    expect(updated[0]?.myCompletedCheckpointIds).toEqual(['cp-1']);
    expect(updated[0]?.memberProgress?.[0]?.completedCheckpointIds).toEqual(['cp-1']);
    expect(progress[0]?.myCompletedCheckpointIds).toEqual([]);
  });

  it('removes a checkpoint when completion is unchecked', () => {
    const checked = updateMyCheckpointCompletion(progress, {
      teamId: 'team-1',
      userId: 'student-1',
      checkpointId: 'cp-1',
      completed: true
    });
    const unchecked = updateMyCheckpointCompletion(checked, {
      teamId: 'team-1',
      userId: 'student-1',
      checkpointId: 'cp-1',
      completed: false
    });

    expect(unchecked[0]?.myCompletedCheckpointIds).toEqual([]);
    expect(unchecked[0]?.memberProgress?.[0]?.completedCheckpointIds).toEqual([]);
  });
});
