import { queryOptions } from '@tanstack/react-query';
import { getClassrooms, getTeams } from './service';
export const classroomKeys = {
  all: ['classrooms'] as const,
  teams: (id: string) => ['classrooms', id, 'teams'] as const
};
export const classroomsQueryOptions = () =>
  queryOptions({ queryKey: classroomKeys.all, queryFn: getClassrooms });
export const classroomTeamsQueryOptions = (id: string) =>
  queryOptions({ queryKey: classroomKeys.teams(id), queryFn: () => getTeams(id) });
