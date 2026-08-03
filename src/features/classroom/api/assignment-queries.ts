import { queryOptions } from '@tanstack/react-query';
import {
  getAssignment,
  getAssignmentProgress,
  getAssignments,
  getAssignmentTeams,
  getClassroomCourses
} from './assignment-service';
export const assignmentKeys = {
  all: ['assignments'] as const,
  list: (classId: string, courseId?: string | null) =>
    [...assignmentKeys.all, classId, courseId ?? 'all'] as const,
  courses: (classId: string) => ['classroom-courses', classId] as const,
  detail: (classId: string, assignmentId: string) =>
    [...assignmentKeys.list(classId), assignmentId] as const,
  teams: (classId: string, assignmentId: string) =>
    [...assignmentKeys.detail(classId, assignmentId), 'teams'] as const,
  progress: (classId: string, assignmentId: string) =>
    [...assignmentKeys.detail(classId, assignmentId), 'progress'] as const
};
export const assignmentsQueryOptions = (classId: string, courseId?: string | null) =>
  queryOptions({
    queryKey: assignmentKeys.list(classId, courseId),
    queryFn: () => getAssignments(classId, courseId)
  });
export const classroomCoursesQueryOptions = (classId: string) =>
  queryOptions({
    queryKey: assignmentKeys.courses(classId),
    queryFn: () => getClassroomCourses(classId)
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
export const assignmentProgressQueryOptions = (classId: string, assignmentId: string) =>
  queryOptions({
    queryKey: assignmentKeys.progress(classId, assignmentId),
    queryFn: () => getAssignmentProgress(classId, assignmentId)
  });
