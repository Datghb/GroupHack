import type {
  ClassroomRecord,
  CreateClassroomPayload,
  CreateTeamPayload,
  TeamRecord
} from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers }
  });
  const body = (await response.json()) as { data?: T; error?: string };
  if (!response.ok || !body.data) throw new Error(body.error ?? 'Không thể xử lý yêu cầu.');
  return body.data;
}
export const getClassrooms = () => request<ClassroomRecord[]>('/api/classrooms');
export const createClassroom = (payload: CreateClassroomPayload) =>
  request<ClassroomRecord>('/api/classrooms', { method: 'POST', body: JSON.stringify(payload) });
export const joinClassroom = (classroomId: string) =>
  request<{ joined: true }>(`/api/classrooms/${classroomId}/enroll`, { method: 'POST' });
export const getTeams = (classroomId: string) =>
  request<TeamRecord[]>(`/api/classrooms/${classroomId}/teams`);
export const createTeam = (classroomId: string, payload: CreateTeamPayload) =>
  request<TeamRecord>(`/api/classrooms/${classroomId}/teams`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const joinExistingTeam = (classroomId: string, teamId: string) =>
  request<TeamRecord>(`/api/classrooms/${classroomId}/teams/${teamId}/join`, { method: 'POST' });
