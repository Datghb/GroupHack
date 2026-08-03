import type { Assignment, Checkpoint, ProgressRecord, ProgressStatus, TeamHealth } from './types';

export function deriveProgressStatus(
  checkpoint: Checkpoint,
  progress: ProgressRecord | undefined,
  now: Date
): ProgressStatus {
  if (progress?.completedAt) return 'COMPLETED';
  if (now > checkpoint.closesAt) return progress?.submittedAt ? 'SUBMITTED' : 'MISSED';
  if (progress?.submittedAt) return 'SUBMITTED';
  if (now > checkpoint.dueAt) return 'LATE';
  if (now < checkpoint.opensAt) return 'UPCOMING';
  if ((progress?.percentage ?? 0) > 0) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

export function calculateOverallProgress(records: ProgressRecord[], total: number): number {
  if (total <= 0) return 0;
  const value = records.reduce((sum, record) => sum + record.percentage, 0) / total;
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function deriveTeamHealth(input: {
  assignment: Assignment;
  progress: number;
  lateCheckpoints: number;
  completedCheckpoints: number;
  lastActivityAt: Date;
  now: Date;
  inactiveAfterDays?: number;
}): TeamHealth {
  if (input.completedCheckpoints === input.assignment.checkpoints.length) return 'COMPLETED';
  if (input.lateCheckpoints > 0) return 'LATE';
  const inactiveMs = (input.inactiveAfterDays ?? 7) * 24 * 60 * 60 * 1000;
  if (input.now.getTime() - input.lastActivityAt.getTime() > inactiveMs) return 'INACTIVE';

  const duration = input.assignment.endAt.getTime() - input.assignment.startAt.getTime();
  const elapsed = input.now.getTime() - input.assignment.startAt.getTime();
  const expected = Math.min(100, Math.max(0, (elapsed / duration) * 100));
  return input.progress + 20 < expected ? 'AT_RISK' : 'ON_TRACK';
}
