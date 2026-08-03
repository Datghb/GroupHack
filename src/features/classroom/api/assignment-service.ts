import type {
  AssignmentRecord,
  AssignmentTeamRecord,
  CreateAssignmentPayload
} from './assignment-types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers }
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Không thể xử lý yêu cầu.');
  return body.data;
}
export const getAssignments = (classId: string) =>
  request<AssignmentRecord[]>(`/api/classrooms/${classId}/assignments`);
export const createAssignment = (classId: string, payload: CreateAssignmentPayload) =>
  request<AssignmentRecord>(`/api/classrooms/${classId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const getAssignment = (classId: string, assignmentId: string) =>
  request<AssignmentRecord>(`/api/classrooms/${classId}/assignments/${assignmentId}`);
export const getAssignmentTeams = (classId: string, assignmentId: string) =>
  request<AssignmentTeamRecord[]>(`/api/classrooms/${classId}/assignments/${assignmentId}/teams`);
export const createAssignmentTeam = (
  classId: string,
  assignmentId: string,
  payload: { name: string; description: string; capacity: number }
) =>
  request<AssignmentTeamRecord>(`/api/classrooms/${classId}/assignments/${assignmentId}/teams`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const joinAssignmentTeam = (classId: string, assignmentId: string, teamId: string) =>
  request<AssignmentTeamRecord>(
    `/api/classrooms/${classId}/assignments/${assignmentId}/teams/${teamId}/join`,
    { method: 'POST' }
  );
