import type { CheckpointScope } from '../domain/checkpoint-scope';

export type { CheckpointScope } from '../domain/checkpoint-scope';

export interface CheckpointRecord {
  id: string;
  title: string;
  description: string;
  dueAt: string | null;
  position: number;
  scope: CheckpointScope;
}
export interface AssignmentRecord {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  dueAt: string | null;
  checkpoints: CheckpointRecord[];
  courseId: string | null;
}
export interface ClassroomCourse {
  id: string;
  name: string;
  position: number;
}
export interface ClassroomCourses {
  courses: ClassroomCourse[];
  selectedCourseId: string | null;
}
export interface AssignmentTeamRecord {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  capacity: number;
  open: boolean;
  hasSubmission: boolean;
  memberIds: string[];
  members: Array<{ id: string; fullName: string; avatarUrl: string | null }>;
  myRequestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  joinRequests: Array<{
    id: string;
    student: { id: string; fullName: string; avatarUrl: string | null };
    createdAt: string;
  }>;
}
export interface TeamJoinRequestResult {
  id: string;
  teamId: string;
  status: 'PENDING';
}
export interface LeaveAssignmentTeamResult {
  status: 'LEFT' | 'DISBANDED';
}
export interface CreateAssignmentPayload {
  title: string;
  description: string;
  dueAt: string;
  checkpoints: Array<{
    dueAt: string;
    scope: CheckpointScope;
  }>;
  courseId: string;
}
export interface UpdateAssignmentPayload {
  title: string;
  description: string;
  dueAt: string;
  checkpoints: Array<{
    id?: string;
    dueAt: string;
    scope: CheckpointScope;
  }>;
}
export interface TeamProgressRecord {
  id: string;
  name: string;
  leaderId: string;
  memberIds: string[];
  completedCheckpointIds: string[];
  myCompletedCheckpointIds: string[];
  memberProgress?: Array<{
    id: string;
    fullName: string;
    avatarUrl: string | null;
    completedCheckpointIds: string[];
  }>;
  completedCheckpoints: number;
  totalCheckpoints: number;
  currentCheckpoint: string;
  progress: number;
  lateCheckpoints: number;
  lastActivityAt: string | null;
}
