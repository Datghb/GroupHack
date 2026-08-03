export type UserRole = 'TEACHER' | 'STUDENT';
export type AssignmentStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type CheckpointType = 'INDIVIDUAL' | 'TEAM';
export type ProgressStatus =
  | 'UPCOMING'
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'LATE'
  | 'MISSED';
export type TeamHealth = 'ON_TRACK' | 'AT_RISK' | 'LATE' | 'INACTIVE' | 'COMPLETED';

export interface ClassroomUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface Classroom {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  archived: boolean;
  studentCount: number;
  teamCount: number;
}

export interface Team {
  id: string;
  classroomId: string;
  name: string;
  description: string;
  leaderId: string;
  memberIds: string[];
  capacity: number;
  open: boolean;
  archived: boolean;
  progress: number;
  completedCheckpoints: number;
  totalCheckpoints: number;
  lateCheckpoints: number;
  currentCheckpoint: string;
  lastActivityAt: Date;
}

export interface Checkpoint {
  id: string;
  assignmentId: string;
  title: string;
  type: CheckpointType;
  order: number;
  opensAt: Date;
  dueAt: Date;
  closesAt: Date;
}

export interface ProgressRecord {
  checkpointId: string;
  ownerId: string;
  percentage: number;
  submittedAt?: Date;
  completedAt?: Date;
}

export interface Assignment {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  status: AssignmentStatus;
  startAt: Date;
  endAt: Date;
  checkpoints: Checkpoint[];
}

export interface Activity {
  id: string;
  teamId: string;
  actor: string;
  message: string;
  createdAt: Date;
}
