import { queryOptions } from '@tanstack/react-query';
import { getAssignment, getAssignments, getAssignmentTeams } from './assignment-service';
export const assignmentKeys = {
  all: ['assignments'] as const,
  list: (classId: string) => [...assignmentKeys.all, classId] as const,
  detail: (classId: string, assignmentId: string) =>
    [...assignmentKeys.list(classId), assignmentId] as const,
  teams: (classId: string, assignmentId: string) =>
    [...assignmentKeys.detail(classId, assignmentId), 'teams'] as const
};
export const assignmentsQueryOptions = (classId: string) =>
  queryOptions({
    queryKey: assignmentKeys.list(classId),
    queryFn: () => getAssignments(classId)
  });
export const assignmentQueryOptions = (classId: string, assignmentId: string) =>
  queryOptions({
    queryKey: assignmentKeys.detail(classId, assignmentId),
    queryFn: () => getAssignment(classId, assignmentId)
  });
export const assignmentTeamsQueryOptions = (classId: string, assignmentId: string) =>
  queryOptions({
    queryKey: assignmentKeys.teams(classId, assignmentId),
    queryFn: () => getAssignmentTeams(classId, assignmentId)
  });
