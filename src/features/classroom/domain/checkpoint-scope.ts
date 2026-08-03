export type CheckpointScope = 'INDIVIDUAL' | 'TEAM';

export function getCheckpointScopeLabel(scope: CheckpointScope): string {
  return scope === 'INDIVIDUAL' ? 'Cá nhân' : 'Nhóm';
}
