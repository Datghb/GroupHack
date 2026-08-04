import type { TeamProgressRecord } from '../api/assignment-types';

interface CheckpointCompletionUpdate {
  teamId: string;
  userId: string;
  checkpointId: string;
  completed: boolean;
}

function updateCheckpointIds(
  checkpointIds: string[],
  checkpointId: string,
  completed: boolean
): string[] {
  if (completed) {
    return checkpointIds.includes(checkpointId) ? checkpointIds : [...checkpointIds, checkpointId];
  }
  return checkpointIds.filter((id) => id !== checkpointId);
}

export function updateMyCheckpointCompletion(
  progress: TeamProgressRecord[],
  update: CheckpointCompletionUpdate
): TeamProgressRecord[] {
  return progress.map((team) => {
    if (team.id !== update.teamId) return team;

    return {
      ...team,
      myCompletedCheckpointIds: updateCheckpointIds(
        team.myCompletedCheckpointIds,
        update.checkpointId,
        update.completed
      ),
      memberProgress: team.memberProgress?.map((member) =>
        member.id === update.userId
          ? {
              ...member,
              completedCheckpointIds: updateCheckpointIds(
                member.completedCheckpointIds,
                update.checkpointId,
                update.completed
              )
            }
          : member
      )
    };
  });
}
