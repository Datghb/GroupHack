export function calculateCheckpointProgress(completed: number, total: number): number {
  if (total <= 0) return 0;
  const safeCompleted = Math.min(Math.max(completed, 0), total);
  return Math.round((safeCompleted / total) * 100);
}

export function isAssignmentCompleted(completed: number, total: number): boolean {
  return total > 0 && completed >= total;
}
