import type { CheckpointScope } from './checkpoint-scope';

interface Checkpoint {
  id: string;
  scope: CheckpointScope;
}

interface Completion {
  checkpoint_id: string;
  completed_by: string;
  completion_scope: CheckpointScope;
}

export function getCheckpointCompletionState({
  checkpoints,
  completions,
  memberIds,
  currentUserId
}: {
  checkpoints: Checkpoint[];
  completions: Completion[];
  memberIds: string[];
  currentUserId: string;
}): {
  completedCheckpointIds: string[];
  myCompletedCheckpointIds: string[];
} {
  const completedCheckpointIds = checkpoints.flatMap((checkpoint) => {
    const relevant = completions.filter((completion) => completion.checkpoint_id === checkpoint.id);
    if (checkpoint.scope === 'TEAM')
      return relevant.some((completion) => completion.completion_scope === 'TEAM')
        ? [checkpoint.id]
        : [];
    const completedMembers = new Set(
      relevant
        .filter((completion) => completion.completion_scope === 'INDIVIDUAL')
        .map((completion) => completion.completed_by)
    );
    return memberIds.length > 0 && memberIds.every((memberId) => completedMembers.has(memberId))
      ? [checkpoint.id]
      : [];
  });
  const myCompletedCheckpointIds = checkpoints.flatMap((checkpoint) => {
    const relevant = completions.filter((completion) => completion.checkpoint_id === checkpoint.id);
    const completed =
      checkpoint.scope === 'TEAM'
        ? relevant.some((completion) => completion.completion_scope === 'TEAM')
        : relevant.some(
            (completion) =>
              completion.completion_scope === 'INDIVIDUAL' &&
              completion.completed_by === currentUserId
          );
    return completed ? [checkpoint.id] : [];
  });
  return { completedCheckpointIds, myCompletedCheckpointIds };
}
