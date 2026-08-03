import type {
  AssignmentRecord,
  AssignmentTeamRecord,
  ClassroomCourses,
  CreateAssignmentPayload,
  TeamJoinRequestResult,
  TeamProgressRecord,
  UpdateAssignmentPayload
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
export const getAssignments = (classId: string, courseId?: string | null) =>
  request<AssignmentRecord[]>(
    `/api/classrooms/${classId}/assignments${courseId ? `?courseId=${encodeURIComponent(courseId)}` : ''}`
  );
export const getClassroomCourses = (classId: string) =>
  request<ClassroomCourses>(`/api/classrooms/${classId}/courses`);
export const selectClassroomCourse = (classId: string, courseId: string) =>
  request<{ selectedCourseId: string }>(`/api/classrooms/${classId}/courses`, {
    method: 'PATCH',
    body: JSON.stringify({ courseId })
  });
export const createAssignment = (classId: string, payload: CreateAssignmentPayload) =>
  request<AssignmentRecord>(`/api/classrooms/${classId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const getAssignment = (classId: string, assignmentId: string) =>
  request<AssignmentRecord>(`/api/classrooms/${classId}/assignments/${assignmentId}`);
export const updateAssignment = (
  classId: string,
  assignmentId: string,
  payload: UpdateAssignmentPayload
) =>
  request<AssignmentRecord>(`/api/classrooms/${classId}/assignments/${assignmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
export const deleteAssignment = (classId: string, assignmentId: string) =>
  request<{ deleted: true }>(`/api/classrooms/${classId}/assignments/${assignmentId}`, {
    method: 'DELETE'
  });
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
  request<TeamJoinRequestResult>(
    `/api/classrooms/${classId}/assignments/${assignmentId}/teams/${teamId}/join`,
    { method: 'POST' }
  );
export const reviewTeamJoinRequest = (
  classId: string,
  assignmentId: string,
  teamId: string,
  requestId: string,
  action: 'APPROVE' | 'REJECT'
) =>
  request<{ status: 'APPROVED' | 'REJECTED' }>(
    `/api/classrooms/${classId}/assignments/${assignmentId}/teams/${teamId}/requests/${requestId}`,
    { method: 'PATCH', body: JSON.stringify({ action }) }
  );
export const getAssignmentProgress = (classId: string, assignmentId: string) =>
  request<TeamProgressRecord[]>(`/api/classrooms/${classId}/assignments/${assignmentId}/progress`);
export const setCheckpointCompleted = (
  classId: string,
  assignmentId: string,
  checkpointId: string,
  completed: boolean
) =>
  request<{ completed: boolean }>(
    `/api/classrooms/${classId}/assignments/${assignmentId}/checkpoints/${checkpointId}/complete`,
    { method: completed ? 'POST' : 'DELETE' }
  );
