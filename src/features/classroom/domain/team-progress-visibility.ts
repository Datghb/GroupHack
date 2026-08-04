interface TeamProgressVisibilityInput {
  role: 'TEACHER' | 'STUDENT' | null;
  userId: string;
  memberIds: string[];
}

export function canViewTeamMemberProgress({
  role,
  userId,
  memberIds
}: TeamProgressVisibilityInput): boolean {
  return role === 'STUDENT' && memberIds.includes(userId);
}

export function getVisibleTeamMemberProgress<T>(
  input: TeamProgressVisibilityInput & { memberProgress: T[] }
): T[] | undefined {
  return canViewTeamMemberProgress(input) ? input.memberProgress : undefined;
}
